export async function onScan() {
    const input = document.getElementById("barcodeInput").value;
    const hehe = await updateCache(input);
    const curr_tab = await getCurrentTab();
    chrome.scripting
      .executeScript({
        target: { tabId: curr_tab.id },
        func: typeText,
        args: [input],
      })
      .then(() => document.getElementById("barcodeInput").value = '');
  }