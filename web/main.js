import { streamGemini } from "./gemini-api.js";

let form = document.querySelector("form");
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector(".output");
let first_time = true;

form.onsubmit = async (ev) => {
  let temperature, humidity, moisture, water;
  fetch("./static/sensor_value.txt")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.text();
    })
    .then((text) => {
      console.log("File content:", text);
      [temperature, humidity, moisture, water] = text.split(",");
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });

  ev.preventDefault();
  try {
    // Load the image as a base64 string
    let imageUrl = form.elements.namedItem("chosen-image").value;
    let imageBase64 = await fetch(imageUrl)
      .then((r) => r.arrayBuffer())
      .then((a) => base64js.fromByteArray(new Uint8Array(a)));
    let contents;
    if (first_time) {
      contents = [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            {
              text:
                "I have uploaded an image of a food item, accompanied by data from various sensors: temperature sourced from a DHT11 sensor " +
                temperature +
                " Celsius, humidity from a DHT11 sensor " +
                humidity +
                "%, moisture from a capacitor soil moisture sensor v1.2" +
                moisture +
                ", and water content from the analog output of an Arduino water sensor" +
                water +
                ". Considering these inputs and the provided image, please furnish comprehensive responses covering the following aspects: assess the spoilage level of the food based on temperature, humidity, moisture, water content and the features from the image; offer recommendations on how to manage the food without wastage given its current condition; in the event of spoilage, provide instructions on sustainable ways of disposing it, such as creating compost; if the food is still usable, suggest the optimal duration for consumption before spoilage; and recommend recipes and strategies to better manage the food based on its level of spoilage, thus preventing unnecessary waste. Please present this information as a bot, with the primary goal of assisting the user in efficiently managing food waste. This is some additional information about the food! " +
                promptInput.value +
                " Thank You!",
            },
          ],
        },
      ];
      first_time = false;
    } else {
      contents = [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            {
              text: promptInput.value,
            },
          ],
        },
      ];
    }

    // Call the gemini-pro-vision model, and get a stream of results
    let stream = streamGemini({
      model: "gemini-pro-vision",
      contents,
    });
    // Read from the stream and interpret the output as markdown
    let buffer = [];
    let md = new markdownit();
    let x;

    for await (let chunk of stream) {
      buffer.push(chunk);
      x = md.render(buffer.join(""));
    }
    output.innerHTML += "<b>Your Query: </b>" + promptInput.value + "<br>";

    output.innerHTML +=
      "<b>RottenAI's Response: </b>" +
      x +
      "<br>-----------------------------------------------------------------------<br>";
  } catch (e) {
    output.innerHTML += "<hr>" + e;
  }
};
