declare module 'omml2mathml' {
    function omml2mathml(element: Element): Element & { outerHTML: string }
    export default omml2mathml
}
