const allowed = new Set(['P', 'BR', 'A', 'STRONG', 'EM', 'B', 'I', 'UL', 'OL', 'LI'])

export function sanitizeProviderHtml(html: string) {
  if (!html.trim() || typeof DOMParser === 'undefined') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.createElement('div')

  function copyInto(parent: HTMLElement, source: Node) {
    source.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        parent.appendChild(doc.createTextNode(child.textContent ?? ''))
        return
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return
      const element = child as HTMLElement
      if (!allowed.has(element.tagName)) {
        copyInto(parent, element)
        return
      }
      const next = doc.createElement(element.tagName.toLowerCase())
      if (element.tagName === 'A') {
        const href = element.getAttribute('href') ?? ''
        if (/^https?:\/\//i.test(href)) {
          next.setAttribute('href', href)
          next.setAttribute('rel', 'noreferrer noopener')
          next.setAttribute('target', '_blank')
        }
      }
      copyInto(next, element)
      parent.appendChild(next)
    })
  }

  copyInto(root, doc.body)
  return root.innerHTML
}
