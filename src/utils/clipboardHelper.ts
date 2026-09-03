/**
 * Robust Cross-Platform & Iframe-Safe Clipboard Helper
 * Supports both navigator.clipboard and fallback document.execCommand('copy')
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Attempt modern Clipboard API if supported and in secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback:', err);
    }
  }

  // 2. Fallback for iframes or environments where navigator.clipboard is blocked
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Prevent zoom and visual jumps
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    // Select the content
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('execCommand fallback copy failed:', err);
    return false;
  }
}
