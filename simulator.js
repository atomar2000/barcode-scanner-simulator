
const scan_button = document.getElementById("scanButton");
const generate_button_2d = document.getElementById("generateBarcode2D");
const generate_button_1d = document.getElementById("generateBarcode1D");
const loadingSpinnerStop = document.getElementById("loadingSpinner");
if (scan_button) scan_button.addEventListener("click", onScan);
if (generate_button_2d) generate_button_2d.addEventListener("click", onGenerate);
if (generate_button_1d) generate_button_1d.addEventListener("click", onGenerate);

const barcodeTypes = new Map();

barcodeTypes.set('1D', "&code=GS1-128&translate-esc=on");
barcodeTypes.set('2D', "&code=DataMatrix&translate-esc=on&dmsize=Default");

window.onload = function() {
    updateCache();
};

async function getCurrentCache(){ 
    var previousBarcodes = [];
    await chrome.storage.local.get(["barcodeCacheData"]).then((result) => { previousBarcodes = result.barcodeCacheData; });
    return previousBarcodes ? previousBarcodes : [];
}

if (loadingSpinnerStop) loadingSpinnerStop.style.display = "none";

var barcodeURL = "https://barcode.tec-it.com/barcode.ashx?data=";
var barcodeData = "";
var barcodeURL_end = "";

function onGenerate(event) {
  const input = document.getElementById("barcodeInput").value;
  barcodeData = parseInput(input);
  if(event.target.textContent === "Create 1D-Barcode") {
    barcodeURL_end = barcodeTypes.get("1D");
  }
  else {
    barcodeURL_end = barcodeTypes.get("2D");
  } 
  updateImage(barcodeData);
  updateCache(input);
  document.getElementById("barcodeInput").value = '';
}

async function onScan() {
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

function typeText(text) {
  for (const char of text) {
    var event = new KeyboardEvent("keydown", { key: char });
    window.document.dispatchEvent(event);
  }
  var event = new KeyboardEvent("keydown", { key: "Enter", keyCode: 13 });
  window.document.dispatchEvent(event);
}

function parseInput(input) {
  var encodedInput = encodeURI(input);
  encodedInput.replace("%7C", "%5CF");
  return encodedInput;
}

function updateImage(barcodeData) {
  document.getElementById("barcodeImage").setAttribute("src", "");
  if (!barcodeData || barcodeData.length === 0) {
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("barcodeImage").setAttribute("src", "");
  } else {
    updateImageSrc("barcodeImage", barcodeURL + barcodeData + barcodeURL_end);
  }
}

function updateImageSrc(imageId, newSrc) {
  var loadingSpinner = document.getElementById("loadingSpinner");
  loadingSpinner.style.display = "block";

  var imageElement = document.getElementById(imageId);
  imageElement.onload = function () {
    loadingSpinner.style.display = "none";
  };

  imageElement.src = newSrc;
}

async function updateCache(input) {
  var previousBarcodes = [];
  await chrome.storage.local.get(["barcodeCacheData"]).then((result) => { previousBarcodes = result.barcodeCacheData; });
  var newBarcodeList = [];
  if (previousBarcodes && input && input.length) {
    for(var i = 0 ; i < previousBarcodes.length ; i++) {
        if(previousBarcodes[i] === input) return;
    }
    newBarcodeList = [input, ...previousBarcodes];
  }
  else if(previousBarcodes){
    newBarcodeList = previousBarcodes;
  } 
  else if(input && input.length) {
    newBarcodeList = [input];
  }
  var ulElement = document.createElement("ul");

  var data = newBarcodeList;
  if(data && data.length > 5) {
    data = data.slice(0,5);
  }
  data.forEach(function (item) {
    var liElement = document.createElement("li");
    var liElementBtn = document.createElement("button");
    liElementBtn.textContent = item;
    liElementBtn.addEventListener('click', onButtonClick);
    liElement.appendChild(liElementBtn);
    ulElement.appendChild(liElement);
  });

  const setBarcode = await chrome.storage.local.set({
    barcodeCacheData: data,
    cacheTime: Date.now(),
  });
  const recentBarcodes = document.querySelector("#recentBarcodes");
  if((recentBarcodes !== undefined || recentBarcodes !== null) && recentBarcodes.hasChildNodes()){
    recentBarcodes.removeChild(recentBarcodes.childNodes[0]);
  }
  recentBarcodes.appendChild(ulElement);
}

function onButtonClick(event) {
    document.getElementById("barcodeInput").value = event.target.textContent;
}

async function getCurrentTab() {
  //let queryOptions = { active: true, lastFocusedWindow: true };
  let queryOptions = { active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}