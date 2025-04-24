import React, { useCallback, useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { filesize } from "filesize";
import "./style.css";

function App() {
  const [file, setFile] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compressedSize, setCompressedSize] = useState(null);
  const [progress, setProgress] = useState(null);

  const BASE_URL = "https://file-compressor-wdfg.onrender.com";

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    setFile(f);
    setOriginalSize(f.size);
    setOutputUrl(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const compressFile = async () => {
    if (!file) return;
    setLoading(true);
    setCompressedSize(null);
    const formData = new FormData();
    formData.append("file", file);

    let endpoint = "";
    const type = file.type;

    if (type.startsWith("image/")) {
      endpoint = "image";
    } else if (type === "application/pdf") {
      endpoint = "pdf";
    } else if (type === "video/mp4") {
      endpoint = "video";
    } else {
      alert("Unsupported file type");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/compress/${endpoint}`,
        formData,
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setProgress(percent);
          },
        }
      );

      const blob = res.data;
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setCompressedSize(blob.size);
    } catch (err) {
      alert("Compression failed");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="body">
      <div className="card">
        <h1>Multi-File Compressor</h1>

        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <p className="file-info">
              {file.name} ({filesize(originalSize)})
            </p>
          ) : (
            <p>Upload or Drag & drop a PNG, JPG, MP4, or PDF file here for Compressing</p>
          )}
        </div>

        <button
          className="button"
          onClick={compressFile}
          disabled={!file || loading}
        >
          {loading ? "Compressing..." : "Compress File"}
        </button>

        {outputUrl && (
          <div className="compressed-file">
            <h2>🎉 Compressed File:</h2>
            <a href={outputUrl} download={`compressed-${file.name}`}>
              Download Compressed File
            </a>

            {compressedSize && (
              <p>
                Original: <strong>{filesize(originalSize)}</strong> &nbsp; | &nbsp;
                Compressed: <strong>{filesize(compressedSize)}</strong> &nbsp; | &nbsp;
                Saved: <strong>{Math.round((1 - compressedSize / originalSize) * 100)}%</strong>
              </p>
            )}
          </div>
        )}

        {loading && progress !== null && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
