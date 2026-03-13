let scriptPromise: Promise<void> | null = null;

export function loadFreshchatScript(host: string): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector('script[data-freshchat]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `${host}/js/widget.js`;
    script.async = true;
    script.setAttribute('data-freshchat', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Freshchat script'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function resetScriptLoader() {
  scriptPromise = null;
}
