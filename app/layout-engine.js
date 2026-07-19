(function () {
  "use strict";

  const clone = value => JSON.parse(JSON.stringify(value));
  const registry = () => window.CATALOG_COMPONENT_REGISTRY || {};
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function normalizedLayout(component) {
    const defaults = registry()[component?.type]?.defaultLayout || {};
    const source = component?.layout || {};
    const responsive = { enabled: false, breakpoint: 320, mode: "column", ...(defaults.responsive || {}), ...(source.responsive || {}) };
    return {
      mode: "free",
      padding: 12,
      gap: 12,
      columns: 2,
      align: "stretch",
      distribution: "fill",
      ...clone(defaults),
      ...clone(source),
      responsive
    };
  }

  function effectiveMode(component, proposedWidth = component?.frame?.width) {
    const layout = normalizedLayout(component);
    if (layout.responsive.enabled && number(proposedWidth) <= number(layout.responsive.breakpoint, 320)) {
      return layout.responsive.mode || "column";
    }
    return layout.mode || "free";
  }

  function baseMinimum(component) {
    const definition = registry()[component?.type] || {};
    return {
      width: Math.max(1, number(component?.constraints?.minWidth, definition.minSize?.width || 1)),
      height: Math.max(1, number(component?.constraints?.minHeight, definition.minSize?.height || 1))
    };
  }

  function itemMinimum(component, proposedFrame) {
    const base = baseMinimum(component);
    const definition = registry()[component?.type];
    let measured = null;
    if (typeof definition?.measureMinimum === "function") {
      measured = definition.measureMinimum(component, proposedFrame || component.frame) || null;
    }
    if (definition?.container) {
      measured = contentMinimum(component, proposedFrame || component.frame);
    }
    return {
      width: Math.max(base.width, number(measured?.width, 0)),
      height: Math.max(base.height, number(measured?.height, 0))
    };
  }

  function managedChildren(component) {
    return (component?.children || []).filter(child => child.layoutItem?.managed !== false && child.layoutItem?.overlay !== true && !child.slot?.name);
  }

  function contentMinimum(component, proposedFrame = component?.frame) {
    const base = baseMinimum(component);
    const definition = registry()[component?.type];
    if (typeof definition?.measureMinimum === "function") {
      const measured = definition.measureMinimum(component, proposedFrame || component.frame) || {};
      base.width = Math.max(base.width, number(measured.width, 0));
      base.height = Math.max(base.height, number(measured.height, 0));
    }
    const children = component?.children || [];
    if (!definition?.container || !children.length) return base;

    if (!definition.container.autoLayout) {
      const freeChildren = children.filter(child => child.slot?.managed === false || !child.slot?.name);
      if (!freeChildren.length) return base;
      const width = Math.max(...freeChildren.map(child => number(child.frame?.x) + itemMinimum(child).width), 0) + 8;
      const height = Math.max(...freeChildren.map(child => number(child.frame?.y) + itemMinimum(child).height), 0) + 8;
      return { width: Math.max(base.width, width), height: Math.max(base.height, height) };
    }

    const layout = normalizedLayout(component);
    const mode = effectiveMode(component, proposedFrame?.width);
    const padding = Math.max(0, number(layout.padding, 12));
    const gap = Math.max(0, number(layout.gap, 12));
    const items = managedChildren(component);
    const freeItems = children.filter(child => child.layoutItem?.overlay !== true && (child.layoutItem?.managed === false || child.slot?.name));
    const mins = items.map(child => itemMinimum(child));
    let width = base.width;
    let height = base.height;

    if (items.length) {
      if (mode === "row") {
        width = Math.max(width, padding * 2 + mins.reduce((sum, item) => sum + item.width, 0) + gap * Math.max(0, mins.length - 1));
        height = Math.max(height, padding * 2 + Math.max(...mins.map(item => item.height)));
      } else if (mode === "column") {
        width = Math.max(width, padding * 2 + Math.max(...mins.map(item => item.width)));
        height = Math.max(height, padding * 2 + mins.reduce((sum, item) => sum + item.height, 0) + gap * Math.max(0, mins.length - 1));
      } else if (mode === "grid") {
        const columns = Math.max(1, Math.min(number(layout.columns, 2), items.length));
        const rows = Math.ceil(items.length / columns);
        const cellMinWidth = Math.max(...mins.map(item => item.width));
        const rowMinimums = Array.from({ length: rows }, (_, row) => Math.max(...mins.slice(row * columns, (row + 1) * columns).map(item => item.height), 1));
        width = Math.max(width, padding * 2 + columns * cellMinWidth + gap * Math.max(0, columns - 1));
        height = Math.max(height, padding * 2 + rowMinimums.reduce((sum, value) => sum + value, 0) + gap * Math.max(0, rows - 1));
      } else {
        width = Math.max(width, ...items.map((child, index) => number(child.frame?.x) + mins[index].width + padding));
        height = Math.max(height, ...items.map((child, index) => number(child.frame?.y) + mins[index].height + padding));
      }
    }

    if (freeItems.length) {
      width = Math.max(width, ...freeItems.map(child => number(child.frame?.x) + itemMinimum(child).width + padding));
      height = Math.max(height, ...freeItems.map(child => number(child.frame?.y) + itemMinimum(child).height + padding));
    }
    return { width: Math.ceil(width), height: Math.ceil(height) };
  }

  function distribute(total, minimums, gap) {
    if (!minimums.length) return [];
    const free = Math.max(0, total - gap * Math.max(0, minimums.length - 1));
    const minTotal = minimums.reduce((sum, value) => sum + value, 0);
    if (free <= minTotal) return minimums.slice();
    const extra = (free - minTotal) / minimums.length;
    return minimums.map(value => value + extra);
  }

  function distributedGap(total, minimums, gap, distribution) {
    const remaining = Math.max(0, total - minimums.reduce((sum, value) => sum + value, 0));
    if (distribution === "between" && minimums.length > 1) return remaining / (minimums.length - 1);
    if (distribution === "around" && minimums.length) return remaining / minimums.length;
    return gap;
  }

  function positionContextualSeparators(component) {
    const mode = effectiveMode(component);
    if (mode !== "row" && mode !== "column") return [];
    const items = managedChildren(component);
    const separators = (component.children || []).filter(child => child.type === "separator" && child.props?.contextual === true && child.layoutItem?.overlay === true);
    const changed = [];
    separators.forEach(separator => {
      let before = items.find(item => item.id === separator.props.beforeId);
      let after = items.find(item => item.id === separator.props.afterId);
      if (!before || !after) {
        const fallback = items.slice(0, 2);
        before = fallback[0];
        after = fallback[1];
        if (before && after) {
          separator.props.beforeId = before.id;
          separator.props.afterId = after.id;
        }
      }
      if (!before || !after) return;
      if (mode === "row") {
        const start = before.frame.x + before.frame.width;
        const end = after.frame.x;
        const top = Math.max(before.frame.y, after.frame.y);
        const bottom = Math.min(before.frame.y + before.frame.height, after.frame.y + after.frame.height);
        separator.props.orientation = "vertical";
        separator.frame = { x: Math.round(start), y: Math.round(top), width: Math.max(8, Math.round(end - start)), height: Math.max(8, Math.round(bottom - top)) };
      } else {
        const start = before.frame.y + before.frame.height;
        const end = after.frame.y;
        const left = Math.max(before.frame.x, after.frame.x);
        const right = Math.min(before.frame.x + before.frame.width, after.frame.x + after.frame.width);
        separator.props.orientation = "horizontal";
        separator.frame = { x: Math.round(left), y: Math.round(start), width: Math.max(8, Math.round(right - left)), height: Math.max(8, Math.round(end - start)) };
      }
      changed.push(separator.id);
    });
    return changed;
  }

  function applyAutoLayout(component) {
    const definition = registry()[component?.type];
    if (!definition?.container?.autoLayout) return [];
    const layout = normalizedLayout(component);
    const mode = effectiveMode(component);
    if (mode === "free") return [];

    const items = managedChildren(component);
    if (!items.length) return [];
    const padding = Math.max(0, number(layout.padding, 12));
    const gap = Math.max(0, number(layout.gap, 12));
    const innerWidth = Math.max(1, component.frame.width - padding * 2);
    const innerHeight = Math.max(1, component.frame.height - padding * 2);
    const changed = [];

    if (mode === "row") {
      const mins = items.map(item => itemMinimum(item).width);
      const widths = layout.distribution === "fill" ? distribute(innerWidth, mins, gap) : mins;
      const actualGap = distributedGap(innerWidth, widths, gap, layout.distribution);
      let x = padding + (layout.distribution === "around" ? actualGap / 2 : 0);
      items.forEach((item, index) => {
        const min = itemMinimum(item);
        const height = layout.align === "start" ? min.height : innerHeight;
        item.frame = { x: Math.round(x), y: padding, width: Math.round(widths[index]), height: Math.round(height) };
        x += widths[index] + actualGap;
        changed.push(item.id);
      });
    } else if (mode === "column") {
      const mins = items.map(item => itemMinimum(item).height);
      const heights = layout.distribution === "fill" ? distribute(innerHeight, mins, gap) : mins;
      const actualGap = distributedGap(innerHeight, heights, gap, layout.distribution);
      let y = padding + (layout.distribution === "around" ? actualGap / 2 : 0);
      items.forEach((item, index) => {
        const min = itemMinimum(item);
        const width = layout.align === "start" ? min.width : innerWidth;
        item.frame = { x: padding, y: Math.round(y), width: Math.round(width), height: Math.round(heights[index]) };
        y += heights[index] + actualGap;
        changed.push(item.id);
      });
    } else if (mode === "grid") {
      const columns = Math.max(1, Math.min(number(layout.columns, 2), items.length));
      const rows = Math.ceil(items.length / columns);
      const cellWidth = Math.max(1, (innerWidth - gap * Math.max(0, columns - 1)) / columns);
      const rowMins = Array.from({ length: rows }, (_, row) => Math.max(...items.slice(row * columns, (row + 1) * columns).map(item => itemMinimum(item).height), 1));
      const rowHeights = distribute(innerHeight, rowMins, gap);
      const rowOffsets = [];
      rowHeights.reduce((y, height, row) => {
        rowOffsets[row] = y;
        return y + height + gap;
      }, padding);
      items.forEach((item, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        item.frame = {
          x: Math.round(padding + column * (cellWidth + gap)),
          y: Math.round(rowOffsets[row]),
          width: Math.round(cellWidth),
          height: Math.round(rowHeights[row])
        };
        changed.push(item.id);
      });
    }
    changed.push(...positionContextualSeparators(component));
    return changed;
  }

  function linesForFrame(frame) {
    return {
      x: [
        { value: frame.x, anchor: "left" },
        { value: frame.x + frame.width / 2, anchor: "center" },
        { value: frame.x + frame.width, anchor: "right" }
      ],
      y: [
        { value: frame.y, anchor: "top" },
        { value: frame.y + frame.height / 2, anchor: "middle" },
        { value: frame.y + frame.height, anchor: "bottom" }
      ]
    };
  }

  function targetLines(siblings, containerSize, safeMargin = 0) {
    const x = [
      { value: 0, source: "container", anchor: "left" },
      { value: containerSize.width / 2, source: "container", anchor: "center" },
      { value: containerSize.width, source: "container", anchor: "right" }
    ];
    const y = [
      { value: 0, source: "container", anchor: "top" },
      { value: containerSize.height / 2, source: "container", anchor: "middle" },
      { value: containerSize.height, source: "container", anchor: "bottom" }
    ];
    if (safeMargin > 0) {
      x.push({ value: safeMargin, source: "safe", anchor: "left" }, { value: containerSize.width - safeMargin, source: "safe", anchor: "right" });
      y.push({ value: safeMargin, source: "safe", anchor: "top" }, { value: containerSize.height - safeMargin, source: "safe", anchor: "bottom" });
    }
    siblings.forEach(sibling => {
      const lines = linesForFrame(sibling.frame);
      lines.x.forEach(line => x.push({ ...line, source: sibling.id }));
      lines.y.forEach(line => y.push({ ...line, source: sibling.id }));
    });
    return { x, y };
  }

  function nearestAlignment(movingLines, targets, tolerance) {
    let best = null;
    movingLines.forEach(moving => targets.forEach(target => {
      const delta = target.value - moving.value;
      const distance = Math.abs(delta);
      if (distance <= tolerance && (!best || distance < best.distance)) {
        best = { delta, distance, target, moving };
      }
    }));
    return best;
  }

  function spacingCandidates(siblings, movingFrame, axis) {
    const horizontal = axis === "x";
    const start = frame => horizontal ? frame.x : frame.y;
    const size = frame => horizontal ? frame.width : frame.height;
    const sorted = siblings.slice().sort((a, b) => start(a.frame) - start(b.frame));
    const candidates = [];
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const first = sorted[index];
      const second = sorted[index + 1];
      const gap = start(second.frame) - (start(first.frame) + size(first.frame));
      if (gap < 0) continue;
      candidates.push({
        value: start(first.frame) - gap - size(movingFrame),
        gap,
        source: [first.id, second.id],
        position: "before"
      });
      candidates.push({
        value: start(second.frame) + size(second.frame) + gap,
        gap,
        source: [first.id, second.id],
        position: "after"
      });
    }
    return candidates;
  }

  function nearestSpacing(current, candidates, tolerance) {
    let best = null;
    candidates.forEach(candidate => {
      const delta = candidate.value - current;
      const distance = Math.abs(delta);
      if (distance <= tolerance && (!best || distance < best.distance)) best = { ...candidate, delta, distance };
    });
    return best;
  }

  function snapFrame(frame, options = {}) {
    const tolerance = Math.max(0, number(options.tolerance, 6));
    const siblings = options.siblings || [];
    const containerSize = options.containerSize || { width: 0, height: 0 };
    const targets = targetLines(siblings, containerSize, options.safeMargin || 0);
    const next = { ...frame };
    const guides = [];
    const mode = options.mode || "move";

    if (options.snapX !== false) {
      const moving = mode === "resize"
        ? [{ value: frame.x + frame.width, anchor: "right" }]
        : linesForFrame(frame).x;
      const alignment = nearestAlignment(moving, targets.x, tolerance);
      const spacing = options.equalSpacing && mode === "move" ? nearestSpacing(frame.x, spacingCandidates(siblings, frame, "x"), tolerance) : null;
      if (spacing && (!alignment || spacing.distance < alignment.distance)) {
        next.x += spacing.delta;
        guides.push({ axis: "x", type: "spacing", value: next.x, gap: spacing.gap, source: spacing.source, position: spacing.position });
      } else if (alignment) {
        if (mode === "resize") next.width += alignment.delta;
        else next.x += alignment.delta;
        guides.push({ axis: "x", type: "alignment", value: alignment.target.value, anchor: alignment.target.anchor, source: alignment.target.source });
      }
    }

    if (options.snapY !== false) {
      const moving = mode === "resize"
        ? [{ value: frame.y + frame.height, anchor: "bottom" }]
        : linesForFrame(frame).y;
      const alignment = nearestAlignment(moving, targets.y, tolerance);
      const spacing = options.equalSpacing && mode === "move" ? nearestSpacing(frame.y, spacingCandidates(siblings, frame, "y"), tolerance) : null;
      if (spacing && (!alignment || spacing.distance < alignment.distance)) {
        next.y += spacing.delta;
        guides.push({ axis: "y", type: "spacing", value: next.y, gap: spacing.gap, source: spacing.source, position: spacing.position });
      } else if (alignment) {
        if (mode === "resize") next.height += alignment.delta;
        else next.y += alignment.delta;
        guides.push({ axis: "y", type: "alignment", value: alignment.target.value, anchor: alignment.target.anchor, source: alignment.target.source });
      }
    }
    return { frame: next, guides };
  }

  window.CatalogLayoutEngine = {
    normalizedLayout,
    effectiveMode,
    baseMinimum,
    contentMinimum,
    itemMinimum,
    applyAutoLayout,
    positionContextualSeparators,
    snapFrame,
    linesForFrame
  };
})();
