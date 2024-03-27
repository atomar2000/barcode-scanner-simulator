const latestTagModule = require("./latestTag");
const currentVersion = require("./projectVersion.json");

const barcodeTypes = new Map();

barcodeTypes.set("1D", "&code=GS1-128&translate-esc=on");
barcodeTypes.set("2D", "&code=DataMatrix&translate-esc=on&dmsize=Default");

window.onload = function () {
  updateCache();
  const scan_button = document.getElementById("scanButton");
  const generate_button_2d = document.getElementById("generateBarcode2D");
  const generate_button_1d = document.getElementById("generateBarcode1D");
  const loadingSpinnerStop = document.getElementById("loadingSpinner");
  if (scan_button) scan_button.addEventListener("click", onScan);
  if (generate_button_2d)
    generate_button_2d.addEventListener("click", onGenerate);
  if (generate_button_1d)
    generate_button_1d.addEventListener("click", onGenerate);
  if (loadingSpinnerStop) loadingSpinnerStop.style.display = "none";
  displayProjectUpdates();
};

function displayProjectUpdates() {
  var currentVersionElement = document.getElementById("currentVersion");
  if (currentVersionElement !== null && currentVersionElement !== undefined)
    currentVersionElement.textContent = currentVersion.version;
  latestTagModule.getLatestTagJson().then((result) => {
    if (result.status === 200) {
      if (currentVersion.version !== result.data?.tag_name) {
        var updateRequiredElement = document.getElementById("udpateRequired");
        if (
          updateRequiredElement !== null &&
          updateRequiredElement !== undefined
        ) {
          updateRequiredElement.setAttribute("href", result.data?.html_url);
          updateRequiredElement.text =
            "Click here to upgrade to: " + result.data?.tag_name;
        }
      }
    }
  });
}

var barcodeURL = "https://barcode.tec-it.com/barcode.ashx?data=";
var barcodeData = "";
var barcodeURL_end = "";

function onGenerate(event) {
  var input = document.getElementById("barcodeInput").value;
  input = input.replace("|", "\\F");
  input = input.replace("<Alt>", "");
  input = input.replace("<Ctrl>", "");
  input = input.replace("<GS>", "\\F");
  barcodeData = parseInput(input);
  if (event.target.textContent === "Create 1D-Barcode") {
    barcodeURL_end = barcodeTypes.get("1D");
  } else {
    barcodeURL_end = barcodeTypes.get("2D");
  }
  updateImage(barcodeData);
  updateCache(input);
  document.getElementById("barcodeInput").value = "";
}

async function onScan() {
  const input = document.getElementById("barcodeInput").value;
  await updateCache(input);
  const curr_tab = await getCurrentTab();
  await chrome.scripting
    .executeScript({
      target: { tabId: curr_tab.id },
      func: typeText,
      args: [input],
    })
    .then(() => (document.getElementById("barcodeInput").value = ""));
}

function typeText(text) {
  text = text.replace("<Alt>", '\u001B');
  console.log("text: ", text);
  text = text.replace("<Ctrl>", "\u001C");
  console.log("text: ", text);
  text = text.replace("<GS>", '\u001D');
  console.log("text: ", text);
  const inputElement = window.document.activeElement;
  for (var idx = 0; idx < text.length; idx++) {
    altPressed = false;
    ctrlPressed = false;
    while (
      idx < text.length &&
      (text[idx] == "\u001B" || text[idx] == "\u001C")
    ) {
      if (text[idx] == "\u001B") {
        altPressed = true;
        idx++;
      }
      if (text[idx] == "\u001C") {
        ctrlPressed = true;
        idx++;
      }
    }
    var event = new KeyboardEvent("keydown", {
      key: text[idx],
      altKey: altPressed,
      ctrlKey: ctrlPressed,
    });
    window.document.dispatchEvent(event);
    if (inputElement) {
      inputElement.value += text[idx];
      inputElement.dispatchEvent(new Event("input"));
    }
  }
  var event = new KeyboardEvent("keydown", { key: "Enter", keyCode: 13 });
  window.document.dispatchEvent(event);
  if (inputElement) {
    inputElement.dispatchEvent(new Event("input"));
  }
}

function parseInput(input) {
  var encodedInput = encodeURI(input);
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
  await chrome.storage.local.get(["barcodeCacheData"]).then((result) => {
    previousBarcodes = result.barcodeCacheData;
  });
  var newBarcodeList = [];
  if (previousBarcodes && input && input.length) {
    var barcodeList = [];
    for (var i = 0; i < previousBarcodes.length; i++) {
      if (previousBarcodes[i] === input) continue;
      barcodeList.push(previousBarcodes[i]);
    }
    newBarcodeList = [input, ...barcodeList];
  } else if (previousBarcodes) {
    newBarcodeList = previousBarcodes;
  } else if (input && input.length) {
    newBarcodeList = [input];
  }
  var ulElement = document.createElement("ul");

  var data = newBarcodeList;
  if (data && data.length > 5) {
    data = data.slice(0, 5);
  }
  data.forEach(function (item) {
    var liElement = document.createElement("li");
    var liElementBtn = document.createElement("button");
    liElementBtn.textContent = item;
    liElementBtn.addEventListener("click", onButtonClick);
    liElement.appendChild(liElementBtn);
    ulElement.appendChild(liElement);
  });

  const setBarcode = await chrome.storage.local.set({
    barcodeCacheData: data,
    cacheTime: Date.now(),
  });
  const recentBarcodes = document.querySelector("#recentBarcodes");
  if (
    recentBarcodes !== undefined &&
    recentBarcodes !== null &&
    recentBarcodes.hasChildNodes()
  ) {
    recentBarcodes.removeChild(recentBarcodes.childNodes[0]);
  }
  if (recentBarcodes !== undefined && recentBarcodes !== null) {
    recentBarcodes.appendChild(ulElement);
  }
}

function onButtonClick(event) {
  document.getElementById("barcodeInput").value = event.target.textContent;
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
