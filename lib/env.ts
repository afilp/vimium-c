/* eslint-disable no-var, @typescript-eslint/no-unused-vars */
if (Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinEnsuredES6WeakMapAndWeakSet) {
  var WeakSet: WeakSetConstructor | undefined;
  var WeakMap: WeakMapConstructor | undefined;
}
if (Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinES6$ForOf$Map$SetAnd$Symbol) {
  var Set: SetConstructor | undefined;
}
if (Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinEnsured$InputDeviceCapabilities) {
  var InputDeviceCapabilities: InputDeviceCapabilitiesVar | undefined;
}
if (Build.BTypes & BrowserType.Chrome && Build.MinCVer < BrowserVer.MinEnsured$requestIdleCallback) {
  // it's not needed to declare it on Edge: only be used in extend_click[Chrome] and injector
  var requestIdleCallback: RequestIdleCallback | undefined;
}
interface VisualViewport { width?: number; height: number; offsetLeft: number; offsetTop: number;
    pageLeft: number; pageTop: number; scale: number; }
if (Build.BTypes & ~BrowserType.Chrome || Build.MinCVer < BrowserVer.MinEnsured$visualViewport$) {
  var visualViewport: VisualViewport | undefined;
}

var VApi: VApiTy, VimiumInjector: VimiumInjectorTy | undefined | null;
if (Build.BTypes & BrowserType.Chrome && Build.BTypes & ~BrowserType.Chrome) { var browser: unknown; }

declare var define: any

Build.NDEBUG || (function (): void {
  type ModuleTy = Dict<any> & { __esModule: boolean }
  type RequireTy = (target: string) => ModuleTy
  interface DefineTy {
    (deps: string[], factory: (require: RequireTy, exports: ModuleTy) => any): any
    amd?: boolean
  }
  const oldDefine: DefineTy = typeof define !== "undefined" ? define : null
  let modules: Dict<ModuleTy> = {}
  const myDefine: DefineTy = (deps, factory): void => {
    const filename = (window as any).__filename as string | undefined
    (window as any).__filename = null
    if (!filename) {
      return oldDefine(deps, factory)
    }
    const exports = modules[filename] || (modules[filename] = {} as ModuleTy)
    const ind = filename.lastIndexOf("/")
    const base = ind > 0 ? filename.slice(0, ind) : filename
    return factory(require.bind(null, base), exports)
  }
  const require = (base: string, target: string): ModuleTy => {
    let i: number
    while ((i = target.indexOf("/")) >= 0) {
      const folder = target.slice(0, i)
      if (folder === "..") {
        let j = base.lastIndexOf("/")
        base = j > 0 ? base.slice(0, j) : ""
      } else if (folder !== ".") {
        base = base ? base + "/" + folder : folder
      }
      target = target.slice(i + 1)
    }
    target = base + "/" + target
    return modules[target] || (modules[target] = {} as ModuleTy)
  }
  myDefine.amd = true;
  (window as any).define = myDefine
})()
