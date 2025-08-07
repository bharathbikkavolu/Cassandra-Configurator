
# Cassandra Configurator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The **Cassandra Configurator** is a full-stack application that streamlines the creation of production-ready Apache Cassandra Amazon Machine Images (AMIs). It provides a user-friendly UI to configure the base OS, Cassandra version, Java/Python distributions, and pre-integrated tools (like Medusa and Reaper), and then generates a pre-baked AMI using Packer and AWS EC2.

> ⚡ Ideal for platform engineers, SREs, and developers who want to automate and accelerate Cassandra environment provisioning in AWS.

---

## ✨ Features

- 🔧 Select OS, Cassandra, Java, and Python versions interactively.
- ✅ Ensures only valid and up-to-date combinations are presented.
- 🧱 Builds pre-configured Amazon Machine Images (AMIs) using [Packer](https://developer.hashicorp.com/packer).
- 🧰 Includes optional tools like:
  - **[Medusa](https://github.com/thelastpickle/cassandra-medusa)** for backup
  - **[Cassandra Reaper](https://github.com/thelastpickle/cassandra-reaper)** for repairs
- 💻 Built with:
  - React (frontend UI)
  - Python (backend logic)
  - AWS EC2 & Image Builder
- ☁️ Future extensibility for:
  - DSE (DataStax Enterprise) support
  - Other clouds: Azure, GCP
  - Docker containerization and public registry publishing

---

## 📸 Screenshots

| Configuration UI | Final AMI Output |
|------------------|------------------|
| ![Configurator UI](./screenshots/screenshot-1.png) | ![AMI ID Output](./screenshots/screenshot-2.png) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js & npm
- AWS credentials configured
- Packer installed

### 1. Clone the Repository

```bash
git clone https://github.com/bharathbikkavolu/Cassandra-Configurator.git
cd Cassandra-Configurator
```

### 2. Run the Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3. Run the Frontend

```bash
cd frontend
npm install
npm start
```

This will launch the Cassandra Configurator UI in your browser.

---

## 🧪 Usage

1. Launch the UI and choose:
   - Operating System (Amazon Linux, Ubuntu, RHEL, Rocky, Oracle)
   - Cassandra Version (e.g., 5.0.4)
   - Java Distribution (OpenJDK)
   - Python Version (e.g., 3.10)
2. Select optional tools:
   - Medusa for backup
   - Reaper for repairs
3. Click `Generate AMI` to:
   - Create a tailored Packer template
   - Launch Packer build
   - Register an AMI in your AWS account

---

## 🧱 Output Example

```bash
AMI created! AMI ID: ami-0a7d80731ae1b2435
```

This AMI is ready for production deployment with Cassandra + selected tools pre-installed.

---

## 📦 Roadmap

- [ ] Add support for DataStax Enterprise (DSE)
- [ ] Azure & GCP integration
- [ ] Docker image packaging
- [ ] Add monitoring tools (e.g., Prometheus, Grafana, Metric Collector)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit PRs.


---

## 🙌 Acknowledgments

- [Apache Cassandra](https://cassandra.apache.org)
- [HashiCorp Packer](https://www.packer.io/)
- [Medusa Backup](https://github.com/thelastpickle/cassandra-medusa)
- [Cassandra Reaper](https://github.com/thelastpickle/cassandra-reaper)
- [Cursor IDE](https://www.cursor.so/) for development
