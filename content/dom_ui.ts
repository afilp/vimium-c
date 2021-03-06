import { setupEventListener, clickable_, isTop, keydownEvents_, VOther, timeout_, fgCache, doc } from "../lib/utils.js"
import * as VKey from "../lib/keyboard_utils.js"
import * as VDom from "../lib/dom_utils.js"
import { currentScrolling } from "./scroller.js"
import { styleSelectable } from "./mode_find.js"
import { unwrap_ff, tryDecodeURL } from "./link_hints.js"
import { post_ } from "../lib/port.js"
import { insert_Lock_ } from "./mode_insert.js"
import { hudTip } from "./hud.js"

let box_: HTMLDivElement & SafeHTMLElement | null = null
let styleIn_: HTMLStyleElement | string | null = null
let root_: VUIRoot = null as never
let cssPatch_: [string, (css: string) => string] | null = null
let lastFlashEl: SafeHTMLElement | null = null
let _toExit = [0, 0] as Array<((this: void) => void) | 0>
let flashTime = 0;

export { box_ as ui_box, root_ as ui_root, styleIn_ as style_ui, lastFlashEl }

export let addUIElement = function (element: HTMLElement, adjust_type?: AdjustType): void {
    box_ = VDom.createElement_("div");
    let root: VUIRoot = root_ = VDom.createShadowRoot_(box_),
    setupListen = (!(Build.BTypes & BrowserType.Chrome) || Build.MinCVer >= BrowserVer.MinEnsuredShadowDOMV1)
        && (!(Build.BTypes & BrowserType.Firefox) || Build.MinFFVer >= FirefoxBrowserVer.MinEnsuredShadowDOMV1)
        && !(Build.BTypes & ~BrowserType.ChromeOrFirefox)
        ? 0 as never : setupEventListener;
    // listen "load" so that safer if shadowRoot is open
    // it doesn't matter to check `.mode == "closed"`, but not `.attachShadow`
    (!(Build.BTypes & BrowserType.Chrome) || Build.MinCVer >= BrowserVer.MinEnsuredShadowDOMV1)
      && (!(Build.BTypes & BrowserType.Firefox) || Build.MinFFVer >= FirefoxBrowserVer.MinEnsuredShadowDOMV1)
      && !(Build.BTypes & ~BrowserType.ChromeOrFirefox) ||
    Build.BTypes & ~BrowserType.Edge && root.mode === "closed" ||
    setupListen(
      !(Build.BTypes & ~BrowserType.Chrome) && Build.MinCVer >= BrowserVer.MinShadowDOMV0
      || Build.BTypes & ~BrowserType.Edge && root !== box_
      ? root as ShadowRoot : 0, "load",
    function Onload(this: ShadowRoot | Window, e: Event): void {
      if (!VDom) { setupListen(0, "load", Onload, 1); return; } // safe enough even if reloaded
      const t = e.target as HTMLElement | Document;
      if (t.parentNode === root_) {
        VKey.Stop_(e); t.onload && t.onload(e);
      }
    }, 0, 1); // should use a listener in active mode: https://www.chromestatus.com/features/5745543795965952
    addUIElement = (element2: HTMLElement, adjust2?: AdjustType, before?: Element | null | true): void => {
      const noPar = box_!.parentNode
      adjust2 !== AdjustType.NotAdjust && !noPar && adjustUI()
      root_.insertBefore(element2, before === true ? root_.firstChild : before || null)
      adjust2 !== AdjustType.NotAdjust && noPar && adjustUI()
    };
    setUICSS = ((innerCSS): void => {
      if (!((!(Build.BTypes & BrowserType.Chrome) || Build.MinCVer >= BrowserVer.MinShadowDOMV0)
            && (!(Build.BTypes & BrowserType.Firefox) || Build.MinFFVer >= FirefoxBrowserVer.MinEnsuredShadowDOMV1)
            && !(Build.BTypes & ~BrowserType.ChromeOrFirefox)) &&
          (!(Build.BTypes & ~BrowserType.Edge) || box_ === root_)) {
        box_!.id = "VimiumUI"
      }
      let el: HTMLStyleElement | null = styleIn_ = createStyle()
      setUICSS = (css) => {
        (styleIn_ as HTMLStyleElement).textContent = cssPatch_ ? cssPatch_[1](css) : css
      };
      setUICSS(innerCSS)
      root_.appendChild(el)
      /**
       * Note: Tests on C35, 38, 41, 44, 47, 50, 53, 57, 60, 63, 67, 71, 72 confirmed
       *        that el.sheet has been valid when promise.then, even on XML pages.
       * `AdjustType.NotAdjust` must be used before a certain, clear normal adjusting
       */
      // enforce webkit to build the style attribute node, and then we can remove it totally
      box_!.hasAttribute("style") && box_!.removeAttribute("style")
      if (adjust_type !== AdjustType.NotAdjust) {
        adjustUI()
      }
    });
    root.appendChild(element);
    if (styleIn_) {
      setUICSS(styleIn_ as Exclude<typeof styleIn_, Element | null | undefined | "">)
    } else {
      box_.style.display = "none";
      if (adjust_type === AdjustType.MustAdjust) {
        adjustUI()
      }
      post_({ H: kFgReq.css });
    }
} as (element: HTMLElement, adjust?: AdjustType, before?: Element | null | true) => void

export const addElementList = function <T extends boolean> (
      els: readonly HintsNS.BaseHintItem[], offset: ViewOffset, dialogContainer?: T
      ): (T extends true ? HTMLDialogElement : HTMLDivElement) & SafeElement {
    const parent = VDom.createElement_(Build.BTypes & BrowserType.Chrome && dialogContainer ? "dialog" : "div");
    parent.className = "R HM" + (Build.BTypes & BrowserType.Chrome && dialogContainer ? " DHM" : "") + fgCache.d;
    for (const el of els) {
      parent.appendChild(el.m);
    }
    const style = parent.style,
    zoom = VDom.bZoom_ / (Build.BTypes & BrowserType.Chrome && dialogContainer ? 1 : VDom.dScale_),
    left = offset[0] + "px", top = offset[1] + "px";
    if ((!(Build.BTypes & ~BrowserType.Firefox)
          || Build.BTypes & BrowserType.Firefox && VOther === BrowserType.Firefox)
        && zoom - 1) {
      style.cssText = `left:0;top:0;transform:scale(${zoom})translate(${left},${top})`;
    } else {
      style.left = left; style.top = top;
      zoom - 1 && (style.zoom = zoom as number | string as string);
    }
    VDom.fullscreenEl_unsafe_() && (style.position = "fixed");
    addUIElement(parent, AdjustType.DEFAULT, lastFlashEl)
    if (Build.BTypes & BrowserType.Chrome) {
      dialogContainer && (parent as HTMLDialogElement).showModal();
    }
    return parent as (T extends true ? HTMLDialogElement : HTMLDivElement) & SafeElement;
}

export const adjustUI = (event?: Event | /* enable */ 1 | /* disable */ 2): void => {
    // Before Firefox 64, the mozFullscreenChangeEvent.target is document
    // so here should only use `VDom.fullscreenEl_unsafe_`
    const el: Element | null = VDom.fullscreenEl_unsafe_(),
    el2 = el && !root_.contains(el) ? el : VDom.docEl_unsafe_()!
    // Chrome also always remove node from its parent since 58 (just like Firefox), which meets the specification
    // doc: https://dom.spec.whatwg.org/#dom-node-appendchild
    //  -> #concept-node-append -> #concept-node-pre-insert -> #concept-node-adopt -> step 2
    event === 2 ? box_!.remove() : el2 !== box_!.parentNode &&
    (Build.BTypes & ~BrowserType.Firefox ? box_!.appendChild.call(el2, box_!) : el2.appendChild(box_!));
    const sin = styleIn_, s = sin && (sin as HTMLStyleElement).sheet
    s && (s.disabled = false);
    if (el || event) {
      const removeEL = !el || event === 2, name = "fullscreenchange";
      if (Build.BTypes & BrowserType.Chrome
          && (!(Build.BTypes & ~BrowserType.Chrome) || VOther === BrowserType.Chrome)) {
        setupEventListener(0, "webkit" + name, adjustUI, removeEL)
      } else if (!(Build.BTypes & ~BrowserType.Firefox)
          || Build.BTypes & BrowserType.Firefox && VOther === BrowserType.Firefox) {
        setupEventListener(0, "moz" + name, adjustUI, removeEL)
      }
      if (!(Build.BTypes & BrowserType.Chrome)
          || fgCache.v >= BrowserVer.MinMaybe$Document$$fullscreenElement) {
        setupEventListener(0, name, adjustUI, removeEL)
      }
    }
}

export const ensureBorder = (zoom?: number): void => {
    zoom || (VDom.getZoom_(), zoom = VDom.wdZoom_);
    if (!cssPatch_ && zoom >= 1) { return; }
    let width = ("" + (
        Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinEnsuredBorderWidthWithoutDeviceInfo
        && fgCache.v < BrowserVer.MinEnsuredBorderWidthWithoutDeviceInfo
        ? 1.01 : 0.51) / zoom).slice(0, 5);
    if (!cssPatch_) {
      cssPatch_ = ["", (css) => {
        return css.replace(<RegExpG> /\b0\.5px|\/\*!DPI\*\/[\w.]+/g, "/*!DPI*/" + cssPatch_![0] + "px");
      }];
    }
    if (cssPatch_[0] === width) { return; }
    cssPatch_[0] = width;
    learnCSS(styleIn_, 1)
}

export const createStyle = (text?: string, css?: HTMLStyleElement): HTMLStyleElement => {
    css = css || VDom.createElement_("style");
    css.type = "text/css";
    text && (css.textContent = text);
    return css;
}

export let setUICSS = (innerCSS: string): void => { styleIn_ = innerCSS }

export const learnCSS = (srcStyleIn: typeof styleIn_, force?: 1): void => {
    if (!styleIn_ || force) {
      const
      css = srcStyleIn && (typeof srcStyleIn === "string" ? srcStyleIn : srcStyleIn.textContent);
      if (css) {
        setUICSS(css)
        force || post_({H: kFgReq.learnCSS});
      }
    }
}

export const checkDocSelectable = (): void => {
    let sout: HTMLStyleElement | null | HTMLBodyElement | HTMLFrameSetElement = styleSelectable
      , gcs = VDom.getComputedStyle_, st: CSSStyleDeclaration
      , mayTrue = !sout || !sout.parentNode;
    if (mayTrue && (sout = doc.body)) {
      st = gcs(sout);
      mayTrue = (Build.BTypes & BrowserType.Firefox && Build.MinFFVer < FirefoxBrowserVer.MinUnprefixedUserSelect
            || Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinUnprefixedUserSelect
            ? st.userSelect || st.webkitUserSelect : st.userSelect) !== "none";
    }
    VDom.markDocSelectable(mayTrue && (st = gcs(VDom.docEl_unsafe_()!),
            Build.BTypes & BrowserType.Firefox && Build.MinFFVer < FirefoxBrowserVer.MinUnprefixedUserSelect
            || Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinUnprefixedUserSelect
            ? st.userSelect || st.webkitUserSelect : st.userSelect) !== "none")
}

export const getSelected = (notExpectCount?: 1): [Selection, ShadowRoot | null] => {
    let el: Node | null, sel: Selection | null;
    if (el = currentScrolling) {
      if (Build.MinCVer >= BrowserVer.Min$Node$$getRootNode && !(Build.BTypes & BrowserType.Edge)
          || !(Build.BTypes & ~BrowserType.Firefox)
          || el.getRootNode) {
        el = el.getRootNode!();
      } else {
        for (let pn: Node | null; pn = VDom.GetParent_unsafe_(el, PNType.DirectNode); el = pn) { /* empty */ }
      }
      if (el !== doc && el.nodeType === kNode.DOCUMENT_FRAGMENT_NODE
          && typeof (el as ShadowRoot).getSelection === "function") {
        sel = (el as ShadowRoot).getSelection!();
        if (sel && (notExpectCount || sel.rangeCount)) {
          return [sel, el as ShadowRoot];
        }
      }
    }
    sel = VDom.getSelection_();
    let offset: number, sr: ShadowRoot | null = null, sel2: Selection | null = sel
      , kTagName = "tagName" as const;
    if (!(  (!(Build.BTypes & BrowserType.Chrome) || Build.MinCVer >= BrowserVer.MinShadowDOMV0)
            && (!(Build.BTypes & BrowserType.Firefox) || Build.MinFFVer >= FirefoxBrowserVer.MinEnsuredShadowDOMV1)
            && !(Build.BTypes & ~BrowserType.ChromeOrFirefox) )) {
      if (Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinEnsuredUnprefixedShadowDOMV0
          && fgCache.v < BrowserVer.MinEnsuredUnprefixedShadowDOMV0
          ? Image.prototype.webkitCreateShadowRoot : typeof ShadowRoot != "function") {
        return [sel, null];
      }
    }
    while (sel2) {
      sel2 = null;
      el = sel.anchorNode;
      if (el && el === sel.focusNode && (offset = sel.anchorOffset) === sel.focusOffset) {
        if (kTagName in <NodeToElement> el
            && (!(Build.BTypes & ~BrowserType.Firefox)
                || (el as Element).childNodes instanceof NodeList && !("value" in (el as Element).childNodes)
            )) {
          el = (el.childNodes as NodeList | RadioNodeList)[offset];
          if (el && kTagName in <NodeToElement> el && (sr = VDom.GetShadowRoot_(el as Element))) {
            if (sr.getSelection && (sel2 = sr.getSelection())) {
              sel = sel2;
            } else {
              sr = null;
            }
          }
        }
      }
    }
    return [sel, sr];
}

  /**
   * return HTMLElement if there's only Firefox
   * @UNSAFE_RETURNED
   */
export const getSelectionParent_unsafe = (selected?: string): Element | null => {
    let sel = getSelected()[0], range = sel.rangeCount ? sel.getRangeAt(0) : null
      , par: Node | null = range && range.commonAncestorContainer, p0 = par;
    while (par && (par as NodeToElement).tagName == null) {
      par = Build.BTypes & ~BrowserType.Firefox ? VDom.GetParent_unsafe_(par, PNType.DirectNode)
            : par.parentNode as Exclude<Node["parentNode"], Window | RadioNodeList | HTMLCollection>;
    }
    // now par is Element or null, and may be a <form> / <frameset>
    if (selected && p0 && p0.nodeType === kNode.TEXT_NODE && (p0 as Text).data.trim().length <= selected.length) {
      let text: HTMLElement["innerText"] | undefined;
      while (par && (text = (par as TypeToAssert<Element, HTMLElement, "innerText">).innerText,
            !(Build.BTypes & ~BrowserType.Firefox) || typeof text === "string")
          && selected.length === (text as string).length) {
        par = VDom.GetParent_unsafe_(par as HTMLElement, PNType.DirectElement);
      }
    }
    return par !== VDom.docEl_unsafe_() ? par as Element | null : null;
}

export const getSelectionText = (notTrim?: 1): string => {
    let sel = VDom.getSelection_(), s = "" + sel, el: Element | null, rect: ClientRect;
    if (s && !insert_Lock_()
        && (el = currentScrolling) && VDom.getEditableType_<0>(el) === EditableType.TextBox
        && (rect = VDom.getSelectionBoundingBox_(sel), !rect.width || !rect.height)) {
      s = "";
    }
    return notTrim ? s : s.trim();
}

export const removeSelection = function (root?: VUIRoot & Pick<DocumentOrShadowRoot, "getSelection">, justTest?: 1
    ): boolean {
    const sel = (root && root.getSelection ? root : window).getSelection!();
    if (!sel || sel.type !== "Range" || !sel.anchorNode) {
      return false;
    }
    justTest || sel.collapseToStart();
    return true;
} as (root?: VUIRoot, justTest?: 1) => boolean

export const resetSelectionToDocStart = (sel?: Selection): void => {
    (sel || VDom.getSelection_()).removeAllRanges();
}

export const click_ = (element: SafeElementForMouse
      , rect?: Rect | null, addFocus?: boolean | BOOL, modifiers?: MyMouseControlKeys | null
      , specialAction?: kClickAction, button?: AcceptableClickButtons
      , /** default: false */ touchMode?: null | false | /** false */ 0 | true | "auto"): void | 1 => {
    if (!(Build.BTypes & ~BrowserType.Edge) || Build.BTypes & BrowserType.Edge && VOther === BrowserType.Edge) {
      if ((element as Partial<HTMLInputElement /* |HTMLSelectElement|HTMLButtonElement */>).disabled) {
        return;
      }
    }
    const center = VDom.center_(rect || (rect = VDom.getVisibleClientRect_(element)));
    if (Build.BTypes & BrowserType.Chrome
        && (!(Build.BTypes & ~BrowserType.Chrome) || VOther === BrowserType.Chrome)
        && (Build.MinCVer >= BrowserVer.MinEnsuredTouchEventConstructor
            || fgCache.v >= BrowserVer.MinEnsuredTouchEventConstructor)
        && (touchMode === !0 || touchMode && VDom.isInTouchMode_cr_!())) {
      let id = VDom.touch_cr_!(element, center);
      if (VDom.IsInDOM_(element)) {
        VDom.touch_cr_!(element, center, id);
      }
      if (!VDom.IsInDOM_(element)) { return; }
    }
    if (element !== VDom.lastHovered_) {
      VDom.hover_(element, center);
      if (!VDom.lastHovered_) { return; }
    }
    if (!(Build.BTypes & ~BrowserType.Firefox) || Build.BTypes & BrowserType.Firefox && VOther & BrowserType.Firefox) {
      // https://bugzilla.mozilla.org/show_bug.cgi?id=329509 says this starts on FF65,
      // but tests also confirmed it on Firefox 63.0.3 x64, Win10
      if ((element as Partial<HTMLInputElement /* |HTMLSelectElement|HTMLButtonElement */>).disabled) {
        return;
      }
    }
    VDom.mouse_(element, "mousedown", center, modifiers, null, button);
    if (!VDom.IsInDOM_(element)) { return; }
    // Note: here we can check doc.activeEl only when @click is used on the current focused document
    if (addFocus && element !== insert_Lock_() && element !== VDom.activeEl_unsafe_() &&
        !(element as Partial<HTMLInputElement>).disabled) {
      element.focus && element.focus();
      if (!VDom.IsInDOM_(element)) { return; }
    }
    VDom.mouse_(element, "mouseup", center, modifiers, null, button);
    if (!VDom.IsInDOM_(element)) { return; }
    if (button === kClickButton.second) {
        // if button is the right, then auxclick can be triggered even if element.disabled
        VDom.mouse_(element, "auxclick", center, modifiers, null, button);
    }
    if (button === kClickButton.second /* is the right button */
        || Build.BTypes & BrowserType.Chrome && (!(Build.BTypes & ~BrowserType.Chrome) || VOther & BrowserType.Chrome)
            && (element as Partial<HTMLInputElement /* |HTMLSelectElement|HTMLButtonElement */>).disabled) {
      return;
    }
    const enum ActionType {
      OnlyDispatch = 0,
      DispatchAndCheckInDOM = 1,
      DispatchAndMayOpenTab = 2,
      OpenTabButNotDispatch = 3,
    }
    let result: ActionType = ActionType.OnlyDispatch, url: string | null;
    if (specialAction) {
      // for forceToDblclick, element can be OtherSafeElement; for 1..MaxOpenForAnchor, element must be HTML <a>
      result = specialAction > kClickAction.MaxOpenForAnchor ? ActionType.DispatchAndCheckInDOM
          : Build.BTypes & BrowserType.Firefox && specialAction < kClickAction.MinNotPlainOpenManually
                && (element as HTMLAnchorElement).target !== "_blank"
            || !(url = element.getAttribute("href"))
            || (!(Build.BTypes & BrowserType.Firefox) || specialAction & kClickAction.forceToOpenInNewTab)
                && url[0] === "#"
            || VDom.jsRe_.test(url)
          ? ActionType.OnlyDispatch
          : Build.BTypes & BrowserType.Firefox
            && specialAction & (kClickAction.plainMayOpenManually | kClickAction.openInNewWindow)
            && (unwrap_ff(element as HTMLAnchorElement).onclick
              || clickable_.has(element))
          ? ActionType.DispatchAndMayOpenTab : ActionType.OpenTabButNotDispatch;
    }
    if ((result > ActionType.OpenTabButNotDispatch - 1 || VDom.mouse_(element, "click", center, modifiers) && result)
        && VDom.getVisibleClientRect_(element)) {
      // require element is still visible
      if (specialAction === kClickAction.forceToDblclick) {
        if (!(element as Partial<HTMLInputElement /* |HTMLSelectElement|HTMLButtonElement */>).disabled) {
          // use old rect
          click_(element, rect, 0, modifiers, kClickAction.none, kClickButton.primaryAndTwice)
          if (VDom.getVisibleClientRect_(element)) {
            VDom.mouse_(element, "dblclick", center, modifiers, null, kClickButton.primaryAndTwice);
          }
        }
        return;
      }
      const isBlank = (element as HTMLAnchorElement).target !== "blank", relAttr = element.getAttribute("rel"),
      /** {@link #FirefoxBrowserVer.Min$TargetIsBlank$Implies$Noopener}; here also apply on Chrome */
      noopener = relAttr == null ? isBlank
          : Build.MinCVer >= BrowserVer.MinEnsuredES6$Array$$Includes || !(Build.BTypes & BrowserType.Chrome)
          ? relAttr.split(<RegExpOne> /\s/).includes!("noopener")
          : relAttr.split(<RegExpOne> /\s/).indexOf("noopener") >= 0,
      reuse = Build.BTypes & BrowserType.Firefox && specialAction! & kClickAction.openInNewWindow
          ? ReuseType.newWindow
          : modifiers && modifiers.shiftKey_ || specialAction! < kClickAction.newTabFromMode
            ? ReuseType.newFg : ReuseType.newBg;
      post_({
        H: kFgReq.openUrl,
        u: (element as HTMLAnchorElement).href,
        f: !0,
        n: noopener,
        r: reuse
      });
      return 1;
    }
}

export const select_ = (element: LockableElement, rect?: Rect | null, show_flash?: boolean
      , action?: SelectActions, suppressRepeated?: boolean): void => {
    const y = scrollY;
    click_(element, rect, 1)
    VDom.view_(element, y);
    // re-compute rect of element, in case that an input is resized when focused
    show_flash && flash_(element)
    if (element !== insert_Lock_()) { return; }
    // then `element` is always safe
    moveSel_need_safe(element, action)
    if (suppressRepeated === true) { VKey.suppressTail_(0); }
}

  /** @NEED_SAFE_ELEMENTS element is LockableElement */
const moveSel_need_safe = (element: LockableElement, action: SelectActions | undefined): void => {
    const elTag = element.localName, type = elTag === "textarea" ? EditableType.TextBox
        : elTag === "input" ? EditableType.input_
        : element.isContentEditable ? EditableType.rich_
        : EditableType.Default;
    if (type === EditableType.Default) { return; }
    const isBox = type === EditableType.TextBox || type === EditableType.rich_
        && element.textContent.includes("\n"),
    lineAllAndBoxEnd = action === "all-input" || action === "all-line",
    gotoStart = action === "start",
    gotoEnd = !action || action === "end" || isBox && lineAllAndBoxEnd;
    if (isBox && gotoEnd && element.clientHeight + 12 < element.scrollHeight) {
      return;
    }
    // not need `this.getSelection_()`
    const sel = VDom.getSelection_();
    try {
      if (type === EditableType.rich_) {
        const range = doc.createRange();
        range.selectNodeContents(element);
        resetSelectionToDocStart(sel)
        sel.addRange(range);
      } else {
        let len = (element as TextElement).value.length
          , { selectionStart: start, selectionEnd: end } = element as TextElement;
        if (!len || (gotoEnd ? start === len : gotoStart && !end) || end && end < len || end !== start) {
          return;
        }
        (element as TextElement).select();
        if (Build.BTypes & BrowserType.Firefox
            && (!(Build.BTypes & ~BrowserType.Firefox) || VOther === BrowserType.Firefox)
            && (gotoEnd || gotoStart)) {
          (element as TextElement).setSelectionRange(gotoEnd ? len : 0, gotoEnd ? len : 0);
          return;
        }
      }
      if (gotoEnd) {
        sel.collapseToEnd();
      } else if (gotoStart) {
        sel.collapseToStart();
      }
    } catch {}
}

export const getRect = (clickEl: Element, refer?: HTMLElementUsingMap | null): Rect | null => {
    VDom.getZoom_(clickEl);
    VDom.prepareCrop_();
    if (refer) {
      return VDom.getClientRectsForAreas_(refer, [], [clickEl as HTMLAreaElement]);
    }
    const rect = Build.BTypes & ~BrowserType.Firefox && VDom.notSafe_not_ff_!(clickEl) ? null
        : VDom.getVisibleClientRect_(clickEl as SafeElement),
    cr = VDom.getBoundingClientRect_(clickEl),
    bcr = VDom.padClientRect_(cr, 8),
    rect2 = rect && !VDom.isContaining_(bcr, rect) ? rect
      : VDom.cropRectToVisible_(bcr.l, bcr.t, bcr.r, bcr.b) ? bcr : null;
    return rect2 && VDom.getCroppedRect_(clickEl, rect2);
}

export const flash_ = function (el: Element | null, rect?: Rect | null, lifeTime?: number, classNames?: string
      ): (() => void) | void {
    rect || (rect = getRect(el!))
    if (!rect) { return; }
    const flashEl = VDom.createElement_("div"), nfs = !VDom.fullscreenEl_unsafe_();
    flashEl.className = "R Flash" + (classNames || "") + (VDom.setBoundary_(flashEl.style, rect, nfs) ? " AbsF" : "");
    Build.BTypes & ~BrowserType.Firefox &&
    VDom.bZoom_ !== 1 && nfs && (flashEl.style.zoom = "" + VDom.bZoom_);
    addUIElement(flashEl)
    lastFlashEl = flashEl
    if (!Build.NDEBUG) {
      lifeTime = lifeTime === -1 ? - 1 : Math.max(lifeTime || 0, flashTime! | 0);
    }
    const remove = (): void => {
      lastFlashEl === flashEl && (lastFlashEl = null)
      flashEl.remove();
    };
    lifeTime === -1 || timeout_(remove, lifeTime || GlobalConsts.DefaultRectFlashTime);
    return remove;
} as {
    (el: null, rect: Rect, lifeTime?: number, classNames?: string): () => void;
    (el: Element, rect?: null, lifeTime?: number, classNames?: string): (() => void) | void;
}

  /** key: 0 := vomnibar; 1 := help dialog */
export const setupExitOnClick = (key: number, callback: ((this: void) => void) | 0): void => {
    const arr = _toExit, diff = arr[key] !== callback;
    arr[key] = callback;
    diff && setupEventListener(0, "click", doExitOnClick, !(arr[0] || arr[1]));
}

export const doExitOnClick = (event?: Event): void => {
    if (event) {
      if (// simulated events generated by page code
          (Build.MinCVer >= BrowserVer.Min$Event$$IsTrusted || !(Build.BTypes & BrowserType.Chrome)
              ? !event.isTrusted : event.isTrusted === false)
          // simulated events generated by browser code
          || !(event as MouseEvent).detail && !(event as MouseEvent).clientY
          // Vimium C has been disabled
          || !box_!.parentNode
          // the click target is in Vimium C's UI
          || ((!(Build.BTypes & BrowserType.Chrome) || Build.MinCVer >= BrowserVer.MinShadowDOMV0)
              && (!(Build.BTypes & BrowserType.Firefox) || Build.MinFFVer >= FirefoxBrowserVer.MinEnsuredShadowDOMV1)
              && !(Build.BTypes & ~BrowserType.ChromeOrFirefox)
              ? event.target === box_
              : !(event.target instanceof Element) || root_.contains(event.target))
          // Vimium C's UI has a selection with type=Range
          || removeSelection(root_, 1)
          ) {
        return;
      }
    }
  for (const i of _toExit) { i && i() }
  _toExit[1] = 0
  setupExitOnClick(0, 0)
}

/** must be called only if having known anotherWindow is "in a same origin" */
export let getWndVApi_ff: ((anotherWindow: Window) => VApiTy | null | void) | undefined
export const setGetWndVApi = (newGetWndVApi: typeof getWndVApi_ff): void => { getWndVApi_ff = newGetWndVApi }

/**
 * Return a valid `ContentWindowCore`
 * only if is a child which in fact has a same origin with its parent frame (ignore `document.domain`).
 *
 * So even if it returns a valid object, `parent.***` may still be blocked
 */
export let getParentVApi = Build.BTypes & BrowserType.Firefox ? (): VApiTy | null | void => {
  if (Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinSafeGlobal$frameElement
      ? !VDom.frameElement_() : !frameElement) {
    // (in Firefox) not use the cached version of frameElement - for less exceptions in the below code
    return;
  }
  // Note: the functionality below should keep the same even if the cached version is used - for easier debugging
  const core = getWndVApi_ff!(parent as Window);
  if ((!(Build.BTypes & ~BrowserType.Firefox) || VOther === BrowserType.Firefox) && core) {
    /** the case of injector is handled in {@link ../content/injected_end.ts} */
    getParentVApi = () => core;
  }
  return core;
} : () => (parent as Window).VApi

export const setParentVApiGetter = (getter: () => VApiTy | null | void): void => { getParentVApi = getter }

export const evalIfOK = (url: Pick<BgReq[kBgReq.eval], "u"> | string): boolean => {
  typeof url === "string" ? 0 : url = url.u
  if (!VDom.jsRe_.test(url)) {
    return false;
  }
  url = url.slice(11).trim();
  if ((<RegExpOne> /^void\s*\( ?0 ?\)\s*;?$|^;?$/).test(url)) { /* empty */ }
  else if (!(Build.BTypes & ~BrowserType.Firefox)
      || Build.BTypes & BrowserType.Firefox && VOther === BrowserType.Firefox
      ? VDom.allowScripts_ === 2 || VDom.allowScripts_ &&
        /*#__INLINE__*/ VDom.markAllowScripts(
            VDom.runJS_("document.currentScript.dataset.vimium=1", 1)!.dataset.vimium ? 2 : 0)
      : VDom.allowScripts_) {
    timeout_(VDom.runJS_.bind(VDom, tryDecodeURL(url, decodeURIComponent)), 0);
  } else {
    hudTip(kTip.failToEvalJS);
  }
  return true;
}

export const checkHidden = (cmd?: FgCmdAcrossFrames, count?: number, options?: OptionsWithForce): BOOL => {
  if (innerHeight < 3 || innerWidth < 3) { return 1; }
  // here should not use the cache frameElement, because `getComputedStyle(frameElement).***` might break
  const curFrameElement_ = !isTop && (Build.BTypes & BrowserType.Firefox && VOther === BrowserType.Firefox
          || !(Build.BTypes & ~BrowserType.Firefox) ? frameElement : VDom.frameElement_()),
  el = !isTop && (curFrameElement_ || VDom.docEl_unsafe_());
  if (!el) { return 0; }
  let box = VDom.getBoundingClientRect_(el),
  parEvents: ReturnType<typeof getParentVApi> | undefined,
  result: boolean | BOOL = !box.height && !box.width || !VDom.isStyleVisible_(el);
  if (cmd) {
    // if in a forced cross-origin env (by setting doc.domain),
    // then par.self.innerHeight works, but this behavior is undocumented,
    // so here only use `parApi.innerHeight_()` in case
    if ((Build.BTypes & BrowserType.Firefox ? (parEvents = getParentVApi()) : curFrameElement_)
        && (result || box.bottom <= 0
            || (Build.BTypes & BrowserType.Firefox && parEvents !== parent
                  ? box.top > parEvents!.innerHeight_ff_!()
                  : box.top > (parent as Window).innerHeight))) {
      Build.BTypes & BrowserType.Firefox || (parEvents = getParentVApi());
      if (parEvents
          && !parEvents.setupKeydownEvents_(keydownEvents_)) {
        parEvents.focusAndRun_(cmd, count!, options!, 1);
        result = 1;
      }
    }
    if (result === true) { // if there's a same-origin parent, use it instead of top
      // here not suppress current cmd, in case of malformed pages;
      // the worst result is doing something in a hidden frame,
      //   which is tolerable, since only few commands do check hidden)
      options!.$forced ? (result = 0) : post_({
        H: kFgReq.gotoMainFrame, f: 1,
        c: cmd,
        n: count!, a: options!
      });
    }
  }
  return +result as BOOL;
}
