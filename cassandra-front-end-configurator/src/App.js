import React, { useEffect, useState } from "react";

const corsProxy = "https://api.allorigins.win/raw?url=";
const cassandraEolApi = "https://endoflife.date/api/apache-cassandra.json";
const cassandraArchive = "https://archive.apache.org/dist/cassandra/";

const javaDistributions = [
  { name: "Eclipse Temurin (Adoptium)", value: "temurin" },
  { name: "Amazon Corretto", value: "corretto" },
  { name: "Zulu OpenJDK (Azul)", value: "zulu" },
  { name: "OpenJDK", value: "openjdk" }
];

const cassandraJavaMatrix = {
  "4.0": [8, 11],
  "4.1": [8, 11],
  "5.0": [11, 17]
};

const requiredTools = [
  "curl", "wget", "tar", "unzip", "systemd/init.d", "openssl"
];

const toolOptions = [
  { key: "backup", label: "Backup (Medusa)" },
  { key: "repairs", label: "Repairs (Reaper)" }
];

const buttonStyle = {
  margin: "1rem 0.5rem 0 0",
  padding: "0.5rem 1.5rem",
  borderRadius: "6px",
  border: "none",
  background: "#2d3a4b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer"
};

function App() {
  const [page, setPage] = useState(1);

  // Page 1 state
  const [cassandraMajors, setCassandraMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [minorVersions, setMinorVersions] = useState([]);
  const [selectedMinor, setSelectedMinor] = useState("");
  const [javaDistribution, setJavaDistribution] = useState("");
  const [javaVersions, setJavaVersions] = useState([]);
  const [javaVersion, setJavaVersion] = useState("");
  const [pythonVersions, setPythonVersions] = useState([]);
  const [pythonVersion, setPythonVersion] = useState("");
  const [os, setOs] = useState("");
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingMinors, setLoadingMinors] = useState(false);
  const [loadingJava, setLoadingJava] = useState(false);
  const [loadingPython, setLoadingPython] = useState(false);
  const [error, setError] = useState("");
  const [amiResult, setAmiResult] = useState(null);

  // Page 2 state
  const [selectedTools, setSelectedTools] = useState({
    backup: false,
    repairs: false,
  });

  // OS options (grouped)
  const osGroups = [
    {
      label: "Amazon Linux",
      options: ["Amazon Linux 2023 AMI", "Amazon Linux 2 AMI"],
    },
    {
      label: "Oracle Linux",
      options: ["Oracle Linux 9", "Oracle Linux 8"],
    },
    {
      label: "Red Hat Enterprise Linux",
      options: ["Red Hat Enterprise Linux 9", "Red Hat Enterprise Linux 8"],
    },
    {
      label: "Rocky Linux",
      options: ["Rocky Linux 9", "Rocky Linux 8"],
    },
    {
      label: "Ubuntu (LTS)",
      options: ["Ubuntu LTS 24.04", "Ubuntu LTS 22.04", "Ubuntu LTS 20.04"],
    },
  ];

  // Fetch Python versions dynamically and filter for Cassandra compatibility
  useEffect(() => {
    if (!selectedMajor) {
      setPythonVersions([]);
      setPythonVersion("");
      return;
    }
    setLoadingPython(true);
    fetch("https://api.allorigins.win/raw?url=https://endoflife.date/api/python.json")
      .then(res => res.json())
      .then(data => {
        console.log("Python API data:", data);
        setPythonVersions(data.map(v => v.cycle)); // Show all cycles for debug
        setLoadingPython(false);
      })
      .catch((e) => {
        console.error("Python fetch error:", e);
        setLoadingPython(false);
      });
  }, [selectedMajor]);

  // Fetch non-EOL Cassandra major versions
  useEffect(() => {
    setLoadingMajors(true);
    fetch(cassandraEolApi)
      .then((res) => res.json())
      .then((data) => {
        const supported = data.filter(
          (v) => !v.eol && !v.prerelease && parseFloat(v.cycle) >= 4.0
        );
        setCassandraMajors(supported);
        setLoadingMajors(false);
      })
      .catch(() => {
        setError("Failed to fetch Cassandra versions");
        setLoadingMajors(false);
      });
  }, []);

  // Fetch minor versions for selected major
  useEffect(() => {
    if (!selectedMajor) {
      setMinorVersions([]);
      setSelectedMinor("");
      return;
    }
    setLoadingMinors(true);
    setMinorVersions([]);
    setSelectedMinor("");
    fetch(corsProxy + cassandraArchive)
      .then((res) => res.text())
      .then((html) => {
        const regex = new RegExp(
          `${selectedMajor.replace(".", "\\.")}\\.\\d+/`,
          "g"
        );
        let matches = Array.from(
          new Set([...html.matchAll(regex)].map((m) => m[0].replace("/", "")))
        );
        matches = matches.filter((v) => !/alpha|beta|rc/i.test(v));
        matches.sort((a, b) => {
          const pa = a.split(".").map(Number);
          const pb = b.split(".").map(Number);
          for (let i = 0; i < pa.length; i++) {
            if (pa[i] !== pb[i]) return pa[i] - pb[i];
          }
          return 0;
        });
        setMinorVersions(matches);
        setLoadingMinors(false);
      })
      .catch(() => {
        setError("Failed to fetch minor versions");
        setLoadingMinors(false);
      });
  }, [selectedMajor]);

  // Fetch Java versions dynamically from Adoptium API
  useEffect(() => {
    if (!javaDistribution || !selectedMajor) {
      setJavaVersions([]);
      setJavaVersion("");
      return;
    }
    setLoadingJava(true);
    fetch("https://api.adoptium.net/v3/info/available_releases")
      .then(res => res.json())
      .then(data => {
        let allowed = [];
        if (cassandraJavaMatrix[selectedMajor]) {
          allowed = data.available_lts_releases.filter(v =>
            cassandraJavaMatrix[selectedMajor].includes(v)
          );
        }
        setJavaVersions(allowed.map(String));
        setLoadingJava(false);
      })
      .catch(() => setLoadingJava(false));
  }, [javaDistribution, selectedMajor]);

  // Handler for Generate AMI
  const handleGenerateAmi = async () => {
    setAmiResult(null);
    const config = {
      os,
      cassandra_version: selectedMajor + (selectedMinor ? `.${selectedMinor.split(".")[2]}` : ""),
      java_distribution: javaDistribution,
      java_version: javaVersion,
      python_version: pythonVersion,
      tools: Object.entries(selectedTools)
        .filter(([k, v]) => v)
        .map(([k]) => k)
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-ami", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      setAmiResult(data);
    } catch (error) {
      setAmiResult({ status: "error", output: "Error connecting to backend: " + error });
    }
  };

  // Page 1: Configurator
  const page1 = (
    <>
      {error && <div style={{color: "#e53e3e", marginBottom: "1rem"}}>{error}</div>}
      {/* OS Dropdown */}
      <div style={{marginBottom: "1.5rem"}}>
        <label style={{display: "block", marginBottom: ".5rem", color: "#4a5568"}}>Operating System</label>
        <select value={os} onChange={e => setOs(e.target.value)} style={selectStyle}>
          <option value="">Select OS</option>
          {osGroups.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {/* Cassandra Major Version Dropdown */}
      <div style={{marginBottom: "1.5rem"}}>
        <label style={{display: "block", marginBottom: ".5rem", color: "#4a5568"}}>Cassandra Version</label>
        <select
          value={selectedMajor}
          onChange={e => {
            setSelectedMajor(e.target.value);
            setJavaDistribution("");
            setJavaVersion("");
            setPythonVersion("");
          }}
          style={selectStyle}
          disabled={loadingMajors}
        >
          <option value="">Select Cassandra Version</option>
          {cassandraMajors.map(v => (
            <option key={v.cycle} value={v.cycle}>
              {v.cycle} (Released: {v.releaseDate})
            </option>
          ))}
        </select>
      </div>
      {/* Minor Version Dropdown */}
      {selectedMajor && (
        <div style={{marginBottom: "1.5rem"}}>
          <label style={{display: "block", marginBottom: ".5rem", color: "#4a5568"}}>Minor Version</label>
          <select
            value={selectedMinor}
            onChange={e => setSelectedMinor(e.target.value)}
            style={selectStyle}
            disabled={loadingMinors || minorVersions.length === 0}
          >
            <option value="">{loadingMinors ? "Loading..." : "Select Minor Version"}</option>
            {minorVersions.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}
      {/* Java Distribution Dropdown */}
      {selectedMajor && (
        <div style={{marginBottom: "1.5rem"}}>
          <label style={{display: "block", marginBottom: ".5rem", color: "#4a5568"}}>Java Distribution</label>
          <select
            value={javaDistribution}
            onChange={e => {
              setJavaDistribution(e.target.value);
              setJavaVersion("");
            }}
            style={selectStyle}
          >
            <option value="">Select Java Distribution</option>
            {javaDistributions.map(d => (
              <option key={d.value} value={d.value}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
      {/* Java Version Dropdown */}
      {selectedMajor && javaDistribution && (
        <div style={{marginBottom: "1.5rem"}}>
          <label style={{display: "block", marginBottom: ".5rem", color: "#4a5568"}}>Java Version</label>
          <select
            value={javaVersion}
            onChange={e => setJavaVersion(e.target.value)}
            style={selectStyle}
            disabled={loadingJava || javaVersions.length === 0}
          >
            <option value="">{loadingJava ? "Loading..." : "Select Java Version"}</option>
            {javaVersions.map(jv => (
              <option key={jv} value={jv}>Java {jv}</option>
            ))}
          </select>
        </div>
      )}
      {/* Python Version Dropdown */}
      {selectedMajor && (
        <div style={{marginBottom: "1.5rem"}}>
          <label style={{display: "block", marginBottom: ".5rem", color: "#4a5568"}}>Python Version</label>
          <select
            value={pythonVersion}
            onChange={e => setPythonVersion(e.target.value)}
            style={selectStyle}
            disabled={loadingPython || pythonVersions.length === 0}
          >
            <option value="">{loadingPython ? "Loading..." : "Select Python Version"}</option>
            {pythonVersions.map(v => (
              <option key={v} value={v}>Python {v}</option>
            ))}
          </select>
        </div>
      )}
      <button onClick={() => setPage(2)} style={buttonStyle} disabled={!os || !selectedMajor || !selectedMinor || !javaDistribution || !javaVersion || !pythonVersion}>
        Next
      </button>
    </>
  );

  // Page 2: Tools selection
  const page2 = (
    <>
      <h3 style={{marginBottom: "1.5rem"}}>Select Additional Tools</h3>
      {toolOptions.map(tool => (
        <div key={tool.key} style={{marginBottom: "1rem"}}>
          <label>
            <input
              type="checkbox"
              checked={selectedTools[tool.key]}
              onChange={e =>
                setSelectedTools(prev => ({
                  ...prev,
                  [tool.key]: e.target.checked
                }))
              }
            />
            {" "}{tool.label}
          </label>
        </div>
      ))}
      <button onClick={() => setPage(1)} style={buttonStyle}>Back</button>
      <button
        onClick={() => setPage(3)}
        style={buttonStyle}
      >
        Finish
      </button>
    </>
  );

  // Page 3: Final summary
  const page3 = (
    <>
      <h3 style={{marginBottom: "1.5rem"}}>Final Configuration</h3>
      <div style={{
        background: "#f7fafc",
        borderRadius: "8px",
        padding: "1rem",
        color: "#2d3a4b"
      }}>
        <ul style={{listStyle: "none", padding: 0, margin: 0}}>
          <li><strong>OS:</strong> {os}</li>
          <li><strong>Cassandra:</strong> {selectedMajor}{selectedMinor ? "." + selectedMinor.split(".")[2] : ""}</li>
          <li>
            <strong>Java:</strong>{" "}
            {javaDistribution && javaVersion
              ? `${javaDistributions.find(d => d.value === javaDistribution)?.name} ${javaVersion}`
              : "None"
            }
          </li>
          <li>
            <strong>Python:</strong> {pythonVersion ? `Python ${pythonVersion}` : "None"}
          </li>
          <li>
            <strong>Other required tools:</strong> {requiredTools.join(", ")}
          </li>
          <li>
            <strong>Selected Tools:</strong>{" "}
            {Object.entries(selectedTools)
              .filter(([k, v]) => v)
              .map(([k]) => toolOptions.find(t => t.key === k)?.label)
              .join(", ") || "None"}
          </li>
        </ul>
      </div>
      <button onClick={() => setPage(2)} style={buttonStyle}>Back</button>
      <button
      style={{ ...buttonStyle, background: "#38a169" }}
      onClick={handleGenerateAmi}
    >
      Generate AMI
    </button>
    {amiResult && (
        <div style={{marginTop: "1.5rem", color: amiResult.status === "success" ? "green" : "red"}}>
          {amiResult.ami_id
            ? <>AMI created! AMI ID: <strong>{amiResult.ami_id}</strong></>
            : <>AMI creation failed: {amiResult.output || amiResult.status}</>
          }
        </div>
      )}
    </>
      
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "2.5rem 2rem",
        width: "100%",
        maxWidth: "480px"
      }}>
        <h2 style={{textAlign: "center", marginBottom: "2rem", color: "#2d3a4b"}}>Cassandra Configurator</h2>
        {page === 1 && page1}
        {page === 2 && page2}
        {page === 3 && page3}
      </div>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  padding: ".5rem",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  fontSize: "1rem",
  background: "#f9fafb"
};

export default App;