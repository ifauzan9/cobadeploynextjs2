"use client";

import {
  FaceMatcher,
  LabeledFaceDescriptors,
  createCanvasFromMedia,
  detectAllFaces,
  detectSingleFace,
  draw,
  fetchImage,
  loadFaceLandmarkModel,
  loadFaceRecognitionModel,
  loadSsdMobilenetv1Model,
  matchDimensions,
  resizeResults,
} from "face-api.js";
import React, { useEffect, useRef, useState } from "react";

export default function FaceRecognition() {
  const videoRef = useRef(null);
  const [label, setLabel] = useState("");
  //   const photoRef = useRef(null);

  //   const [hasPhoto, setHasPhoto] = useState(false);

  //   const getVideo = () => {
  //     navigator.mediaDevices
  //       .getUserMedia({
  //         video: { width: 1920, height: 1080 },
  //       })
  //       .then((stream) => {
  //         let video = videoRef.current;
  //         video.srcObject = stream;
  //         video.play();
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   };

  function getLabeledFaceDescriptions() {
    const labels = ["gia", "ilham", "ridwan"];
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i < 2; i++) {
          const img = await fetchImage(`./images/${label}/${i}.png`);
          // console.log(img);
          const detections = await detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detections.descriptor);
          // console.log(detections);
        }
        return new LabeledFaceDescriptors(label, descriptions);
      })
    );
  }

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 700, height: 400 },
        audio: false,
      })
      .then((stream) => {
        //   videoRef.srcObject = stream;
        let video = videoRef.current;
        video.srcObject = stream;
        // video.play();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const loadModels = async () => {
    console.log("loading...");
    await loadSsdMobilenetv1Model("../models");
    await loadFaceLandmarkModel("../models");
    await loadFaceRecognitionModel("../models");
    console.log("sukses");
    startVideo();
  };

  //   useEffect(() => {
  //     console.log("hello");
  //   });

  useEffect(() => {
    loadModels();
  });

  const videoPlay = async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new FaceMatcher(labeledFaceDescriptors);

    const canvas = createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = await resizeResults(detections, displaySize);

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      const results = resizedDetections.map((d) => {
        return faceMatcher.findBestMatch(d.descriptor);
      });

      if (results.length > 0) {
        console.log(results[0].label);
        setLabel(results[0].label);
      } else {
        setLabel("none");
      }
      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box;
        const drawBox = new draw.DrawBox(box, {
          label: result,
        });
        drawBox.draw(canvas);
      });
    }, 100);
  };

  return (
    <div>
      <video
        ref={videoRef}
        onPlayCapture={videoPlay}
        id="video"
        width="600"
        height="450"
        autoPlay
      />
      <button>SNAP !</button>
      <h1 style={{ color: "#fff" }}>{label}</h1>
      {/* <img src="/images/ridwan/1.png"></img> */}
    </div>
  );
}
