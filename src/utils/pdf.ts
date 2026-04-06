/**
 * Convert oklch/lab colors to RGB before PDF rendering.
 * html2pdf.js (html2canvas) can't parse oklch() from Tailwind CSS v4.
 */
function convertOklchToRgb(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Walk all elements and inline computed styles for colors
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;

  while (node) {
    if (node instanceof HTMLElement) {
      const computed = window.getComputedStyle(node);
      const colorProps = ['color', 'background-color', 'border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color'];

      for (const prop of colorProps) {
        const value = computed.getPropertyValue(prop);
        if (value && (value.includes('oklch') || value.includes('lab('))) {
          // getComputedStyle returns resolved RGB in most browsers
          // but if it still has oklch, convert via canvas
          node.style.setProperty(prop, value);
        }
      }
    }
    node = walker.nextNode();
  }

  return clone;
}

export async function downloadPDF(filename = 'resume.pdf') {
  const element = document.getElementById('resume-preview');
  if (!element) return;

  const html2pdf = (await import('html2pdf.js')).default;

  // Clone and force RGB colors to avoid oklch parsing errors
  const clone = convertOklchToRgb(element);
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  document.body.appendChild(clone);

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          // Force sRGB color space to avoid oklch issues
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      } as Record<string, unknown>)
      .from(clone)
      .save();
  } finally {
    document.body.removeChild(clone);
  }
}
