(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.9";
  const CAPTION_BAND_HEIGHT = 24;
  const GALLERY_ITEM_MINIMUM = 44;
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const slotChildren = (component, slotName) => (component?.children || []).filter(child => child.slot?.name === slotName);

  function isVariants(component) {
    return component?.type === "product-card" && component.presentation?.mode === "variants";
  }

  function isCompact(component) {
    const state = component?.presentation?.responsiveState;
    if (state === "compact") return true;
    if (state === "wide") return false;
    return number(component?.frame?.width) < 320;
  }

  function componentMinimumHeight(component, registry, fallback = 1) {
    const definition = registry?.[component?.type] || {};
    return Math.max(1, number(component?.constraints?.minHeight, number(definition.minSize?.height, fallback)));
  }

  function artItemMinimumHeight(item, registry) {
    const base = Math.max(GALLERY_ITEM_MINIMUM, componentMinimumHeight(item, registry, GALLERY_ITEM_MINIMUM));
    const caption = String(item?.props?.caption || "").trim();
    const below = item?.props?.captionPosition !== "overlay";
    return base + (caption && below ? CAPTION_BAND_HEIGHT : 0);
  }

  function galleryMinimumHeight(gallery, registry) {
    const items = (gallery?.children || []).filter(child => child.type === "art");
    const base = componentMinimumHeight(gallery, registry, 96);
    if (!items.length) return base;
    const columns = Math.max(1, Math.min(number(gallery.layout?.columns, 3), items.length));
    const rows = Math.ceil(items.length / columns);
    const padding = Math.max(0, number(gallery.layout?.padding, 4));
    const gap = Math.max(0, number(gallery.layout?.gap, 6));
    const rowMinimums = Array.from({ length: rows }, (_, row) => Math.max(
      1,
      ...items.slice(row * columns, (row + 1) * columns).map(item => artItemMinimumHeight(item, registry))
    ));
    return Math.max(base, padding * 2 + rowMinimums.reduce((sum, height) => sum + height, 0) + gap * Math.max(0, rows - 1));
  }

  function artMinimumHeight(component, registry) {
    const art = slotChildren(component, "art")[0];
    if (!art) return 0;
    if (art.type === "art-gallery") return galleryMinimumHeight(art, registry);
    return artItemMinimumHeight(art, registry);
  }

  function specificationsMinimumHeight(component, registry, specificationsSlot) {
    const items = slotChildren(component, "specifications");
    if (!items.length) return 0;
    const gap = Math.max(0, number(specificationsSlot?.gap, 7));
    const minimums = items.map(item => componentMinimumHeight(item, registry, 24));
    const layout = typeof specificationsSlot?.layout === "function" ? specificationsSlot.layout(component) : specificationsSlot?.layout;
    if (layout === "grid") {
      const columns = Math.max(1, Math.min(number(specificationsSlot?.columns, 2), items.length));
      const rows = Math.ceil(items.length / columns);
      const rowMinimums = Array.from({ length: rows }, (_, row) => Math.max(1, ...minimums.slice(row * columns, (row + 1) * columns)));
      return rowMinimums.reduce((sum, height) => sum + height, 0) + gap * Math.max(0, rows - 1);
    }
    if (layout === "row") return Math.max(...minimums);
    return minimums.reduce((sum, height) => sum + height, 0) + gap * Math.max(0, items.length - 1);
  }

  function installGeometry(registry) {
    const card = registry?.["product-card"];
    const slots = card?.container?.slots || [];
    const artSlot = slots.find(slot => slot.name === "art");
    const specificationsSlot = slots.find(slot => slot.name === "specifications");
    const tableSlot = slots.find(slot => slot.name === "table");
    if (!artSlot?.getFrame || !specificationsSlot?.getFrame || !tableSlot?.getFrame) return false;
    if (card.__variantsContractVersion === CONTRACT_VERSION) return true;

    const originalArtFrame = artSlot.getFrame;
    const originalSpecificationsFrame = specificationsSlot.getFrame;
    const originalTableFrame = tableSlot.getFrame;
    const originalMeasureMinimum = card.measureMinimum;

    function rawFrames(component) {
      return {
        art: { ...originalArtFrame(component) },
        specifications: { ...originalSpecificationsFrame(component) },
        table: { ...originalTableFrame(component) }
      };
    }

    function requirements(component) {
      const artPresent = slotChildren(component, "art").length > 0;
      const specificationsPresent = slotChildren(component, "specifications").length > 0;
      const tablePresent = slotChildren(component, "table").length > 0;
      const artMinimum = artPresent ? artMinimumHeight(component, registry) : 0;
      const specificationsMinimum = specificationsPresent ? specificationsMinimumHeight(component, registry, specificationsSlot) : 0;
      const gap = artPresent && specificationsPresent ? (component.presentation?.density === "compact" ? 6 : 14) : 0;
      return { artPresent, specificationsPresent, tablePresent, artMinimum, specificationsMinimum, gap };
    }

    function frames(component) {
      const raw = rawFrames(component);
      if (!isVariants(component)) return raw;
      const required = requirements(component);
      if (!required.artPresent && !required.specificationsPresent) return raw;

      const source = required.artPresent ? raw.art : raw.specifications;
      const edge = Math.max(0, number(source.x, component.presentation?.density === "compact" ? 8 : 12));
      const top = Math.min(
        required.artPresent ? raw.art.y : Number.POSITIVE_INFINITY,
        required.specificationsPresent ? raw.specifications.y : Number.POSITIVE_INFINITY
      );
      const bottom = required.tablePresent ? raw.table.y : Math.max(top + 1, number(component.frame?.height) - edge);
      const available = Math.max(1, bottom - top);
      const width = Math.max(1, number(component.frame?.width) - edge * 2);

      if (required.artPresent && required.specificationsPresent) {
        const distributable = Math.max(2, available - required.gap);
        let specificationsHeight;
        let artHeight;
        if (distributable >= required.artMinimum + required.specificationsMinimum) {
          specificationsHeight = required.specificationsMinimum;
          artHeight = distributable - specificationsHeight;
        } else {
          const desiredSpecifications = Math.max(1, Math.round(distributable * (isCompact(component) ? 0.42 : 0.38)));
          specificationsHeight = Math.min(required.specificationsMinimum, desiredSpecifications);
          artHeight = Math.max(1, distributable - specificationsHeight);
        }
        raw.art = { x: edge, y: top, width, height: artHeight };
        raw.specifications = {
          x: edge,
          y: top + artHeight + required.gap,
          width,
          height: Math.max(1, available - artHeight - required.gap)
        };
      } else if (required.artPresent) {
        raw.art = { x: edge, y: top, width, height: available };
      } else {
        raw.specifications = { x: edge, y: top, width, height: available };
      }
      return raw;
    }

    card.measureMinimum = function measureVariantsMinimum(component, proposedFrame) {
      const base = typeof originalMeasureMinimum === "function"
        ? originalMeasureMinimum(component, proposedFrame) || {}
        : card.minSize || {};
      if (!isVariants(component)) return base;
      const preview = { ...component, frame: { ...(component.frame || {}), ...(proposedFrame || {}) } };
      const raw = rawFrames(preview);
      const required = requirements(preview);
      const source = required.artPresent ? raw.art : raw.specifications;
      const edge = Math.max(0, number(source?.x, preview.presentation?.density === "compact" ? 8 : 12));
      const top = Math.min(
        required.artPresent ? raw.art.y : Number.POSITIVE_INFINITY,
        required.specificationsPresent ? raw.specifications.y : Number.POSITIVE_INFINITY
      );
      const bottom = required.tablePresent ? raw.table.y : Math.max(top + 1, number(preview.frame?.height) - edge);
      const available = Math.max(0, bottom - top);
      const needed = required.artMinimum + required.specificationsMinimum + required.gap;
      const shortage = Math.max(0, needed - available);
      return {
        width: Math.max(number(card.minSize?.width, 220), number(base.width, 0)),
        height: Math.ceil(Math.max(number(card.minSize?.height, 190), number(base.height, 0), number(preview.frame?.height) + shortage))
      };
    };

    artSlot.getFrame = component => frames(component).art;
    specificationsSlot.getFrame = component => frames(component).specifications;
    Object.defineProperty(card, "__variantsContractVersion", { value: CONTRACT_VERSION });
    Object.defineProperty(artSlot, "__variantsContractVersion", { value: CONTRACT_VERSION });
    Object.defineProperty(specificationsSlot, "__variantsContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  function documentSnapshot(state) {
    const snapshot = clone(state);
    delete snapshot.editor;
    delete snapshot.updatedAt;
    return snapshot;
  }

  function installStoreContract() {
    const BaseStore = window.CatalogDocumentStore;
    if (!BaseStore || BaseStore.__variantsContractVersion === CONTRACT_VERSION) return Boolean(BaseStore);

    class VariantsDocumentStore extends BaseStore {
      constructor(initialState) {
        super(initialState);
        this.__variantsPendingCardIds = new Set();
        this.refreshAllVariantsCards();
        const snapshot = documentSnapshot(this.state);
        const signature = JSON.stringify(snapshot);
        this.lastHistorySnapshot = snapshot;
        this.lastHistorySignature = signature;
        this.savedSignature = signature;
        this.dirty = false;
      }

      variantsCardFor(componentId) {
        const record = this.findComponent(componentId);
        return record?.path?.slice().reverse().find(component => component.type === "product-card" && isVariants(component)) || null;
      }

      allVariantsCards() {
        const cards = [];
        const visit = component => {
          if (isVariants(component)) cards.push(component);
          (component.children || []).forEach(visit);
        };
        (this.state?.pages || []).forEach(page => (page.children || []).forEach(visit));
        return cards;
      }

      refreshVariantsCard(cardOrId) {
        const card = typeof cardOrId === "string" ? this.findComponent(cardOrId)?.component : cardOrId;
        if (!isVariants(card)) return false;
        this.ensureContainerMinimum(card, this.getParentId(card.id));
        this.reflowComponentTree(card, { derived: true });
        return true;
      }

      refreshAllVariantsCards() {
        this.allVariantsCards().forEach(card => this.refreshVariantsCard(card));
      }

      deleteComponent(componentId) {
        const card = this.variantsCardFor(componentId);
        if (card) this.__variantsPendingCardIds.add(card.id);
        return super.deleteComponent(componentId);
      }

      emit(change, options = {}) {
        const candidateIds = new Set(this.__variantsPendingCardIds || []);
        this.__variantsPendingCardIds?.clear();
        [change?.componentId, change?.cardId, change?.parentId, this.state?.editor?.selectedComponentId].filter(Boolean).forEach(id => candidateIds.add(id));
        (change?.componentIds || []).forEach(id => candidateIds.add(id));

        const refreshAll = new Set(["document-replaced", "document-imported", "document-compiled", "package-imported"]).has(change?.type);
        if (refreshAll) this.refreshAllVariantsCards();
        else {
          const cards = new Map();
          candidateIds.forEach(id => {
            const direct = this.findComponent(id)?.component;
            if (isVariants(direct)) cards.set(direct.id, direct);
            const ancestor = this.variantsCardFor(id);
            if (ancestor) cards.set(ancestor.id, ancestor);
          });
          cards.forEach(card => this.refreshVariantsCard(card));
        }
        return super.emit(change, options);
      }
    }

    Object.defineProperty(VariantsDocumentStore, "__variantsContractVersion", { value: CONTRACT_VERSION });
    window.CatalogDocumentStore = VariantsDocumentStore;
    return true;
  }

  function inspect(component) {
    const registry = window.CATALOG_COMPONENT_REGISTRY || {};
    const slots = registry["product-card"]?.container?.slots || [];
    return {
      variants: isVariants(component),
      compact: isCompact(component),
      artMinimum: artMinimumHeight(component, registry),
      specificationsMinimum: specificationsMinimumHeight(component, registry, slots.find(slot => slot.name === "specifications")),
      art: slots.find(slot => slot.name === "art")?.getFrame?.(component) || null,
      specifications: slots.find(slot => slot.name === "specifications")?.getFrame?.(component) || null,
      table: slots.find(slot => slot.name === "table")?.getFrame?.(component) || null
    };
  }

  function install() {
    const geometryInstalled = installGeometry(window.CATALOG_COMPONENT_REGISTRY);
    const storeInstalled = installStoreContract();
    return { version: CONTRACT_VERSION, geometryInstalled, storeInstalled };
  }

  window.CatalogProductVariantsContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, inspect });
})();
