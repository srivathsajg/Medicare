# 🏥 Blockchain-Enabled Secure Healthcare System

A secure and intelligent healthcare management system that combines **Blockchain, Artificial Intelligence, OCR, and modern web technologies** to provide secure medical record management, smart diagnosis, pharmacy management, and personalized healthcare services.

The system is designed to improve **data security, transparency, privacy, and accessibility** of healthcare information while reducing the risk of unauthorized modification of medical records.

---

## 🚀 Key Features

### 👤 Patient Management
- Patient registration and authentication
- Secure access to medical records
- View prescriptions and medical reports
- Book doctor appointments
- Track medicine deliveries
- Blockchain-verified medical records

### 👨‍⚕️ Doctor Management
- Doctor authentication
- View assigned patients
- Create and update medical records
- Generate digital prescriptions
- Manage appointments
- Access patient medical history

### 💊 Pharmacy Management
- Manage medicine inventory
- View digital prescriptions
- Process medicine requests
- Manage medicine delivery
- Track prescription and delivery status

### 🔗 Blockchain Security
- Blockchain-based medical record verification
- SHA-256 hashing of medical records
- Tamper detection
- IPFS-based off-chain medical document storage
- Ethereum smart contracts
- Immutable audit trail

### 🤖 AI-Powered Healthcare
- AI-based smart diagnosis
- Personalized diet recommendations
- Health report analysis
- BMI, BMR and TDEE-based recommendations
- Machine learning-based healthcare predictions

### 📄 OCR-Based Medical Report Processing
- Upload medical reports
- Extract text from medical documents
- Automatically identify important health parameters
- Process values such as:
  - Hemoglobin
  - HbA1c
  - Glucose
  - Cholesterol
  - Other medical parameters

### 📦 Medicine Delivery
- Medicine delivery requests
- Pharmacy-to-ward delivery workflow
- Delivery staff assignment
- Delivery status tracking
- Blockchain-based delivery verification

### 🔐 Security
- JWT authentication
- Role-Based Access Control (RBAC)
- AES-256 data encryption
- SHA-256 hashing
- Secure API communication
- Protected medical information

---

## 👥 User Roles

The system supports multiple healthcare roles:

| Role | Responsibilities |
|------|------------------|
| 👤 Patient | Manage health information, appointments and prescriptions |
| 👨‍⚕️ Doctor | Manage patients, medical records and prescriptions |
| 💊 Pharmacist | Manage prescriptions, inventory and medicine delivery |
| 🚚 Delivery Staff | Handle and update medicine deliveries |
| 🧪 Lab Technician | Manage laboratory reports and test results |
| 👨‍💼 Hospital Admin | Manage hospital operations and users |
| 🔑 Super Admin | Manage the complete platform |

---

## 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express.js
- JavaScript
- JWT Authentication
- REST APIs

### Database

- MongoDB
- Mongoose

### Blockchain

- Ethereum
- Solidity
- Hardhat
- Ethers.js
- MetaMask

### Decentralized Storage

- IPFS
- Pinata

### Artificial Intelligence & OCR

- Python
- Machine Learning
- Artificial Neural Networks (ANN)
- CNN
- Tesseract OCR
- OpenCV

### Security

- JWT
- RBAC
- AES-256 Encryption
- SHA-256 Hashing

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       Patient       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    React Frontend   │
                    │   Vite + Tailwind   │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                    ┌──────────▼──────────┐
                    │   Node.js + Express │
                    │      Backend        │
                    └──────┬─────┬────────┘
                           │     │
              ┌────────────┘     └─────────────┐
              ▼                                ▼
      ┌───────────────┐                ┌──────────────┐
      │   MongoDB     │                │ AI / OCR     │
      │   Database    │                │ Microservice │
      └───────────────┘                └──────────────┘
              │
              │ Medical Record Hash
              ▼
      ┌─────────────────┐
      │ Ethereum /      │
      │ Smart Contract  │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │      IPFS       │
      │ Medical Files   │
      └─────────────────┘
🔗 Blockchain Workflow
Medical Record
      │
      ▼
Generate SHA-256 Hash
      │
      ▼
Store Medical Document on IPFS
      │
      ▼
Store IPFS CID + Hash
      │
      ▼
Ethereum Smart Contract
      │
      ▼
Blockchain Verification
      │
      ▼
Detect Unauthorized Modification

The actual medical documents are stored off-chain, while their hashes and IPFS references are used for blockchain verification.

🤖 AI & OCR Workflow
Medical Report
      │
      ▼
Upload Report
      │
      ▼
OCR Processing
      │
      ▼
Extract Medical Parameters
      │
      ▼
Data Processing
      │
      ▼
AI / ML Analysis
      │
      ▼
Healthcare Recommendation
📁 Project Structure
Blockchain-Enabled-Secure-Healthcare-System/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── ...
│
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   └── hardhat.config.js
│
├── ai-service/
│   ├── models/
│   ├── services/
│   └── ...
│
├── README.md
└── ...

The exact structure may vary depending on the implementation.

⚙️ Installation & Setup
1. Clone the Repository
git clone YOUR_GITHUB_REPOSITORY_LINK
2. Navigate to the Project
cd Blockchain-Enabled-Secure-Healthcare-System
3. Setup Backend
cd backend
npm install

Create a .env file and configure:

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

IPFS_API_KEY=your_ipfs_api_key
IPFS_SECRET_KEY=your_ipfs_secret_key

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=your_contract_address

Start the backend:

npm run dev
4. Setup Frontend
cd frontend
npm install
npm run dev

The frontend will normally run at:

http://localhost:5173
5. Setup Blockchain

Start the local Hardhat blockchain:

npx hardhat node

Deploy the smart contract:

npx hardhat run scripts/deploy.js --network localhost

Update the deployed contract address in the backend environment configuration.

6. Setup AI Service

Navigate to the AI service:

cd ai-service

Create and activate a Python virtual environment:

python -m venv venv

Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the AI service according to the project configuration.

🔐 Security Architecture

The system follows multiple layers of security:

User
 │
 ▼
JWT Authentication
 │
 ▼
Role-Based Access Control
 │
 ▼
Encrypted Database
 │
 ▼
SHA-256 Record Hash
 │
 ▼
Blockchain Verification
 │
 ▼
IPFS Document Storage

This approach helps protect sensitive healthcare information while providing a transparent method for verifying medical records.

🎯 Project Objectives

The main objectives of the project are:

🔒 Secure healthcare data management
🔗 Prevent unauthorized modification of medical records
🧠 Provide AI-assisted healthcare services
📄 Automate medical report data extraction using OCR
💊 Improve pharmacy and medicine delivery management
👥 Provide role-based healthcare access
🔍 Enable transparent medical record verification
🌐 Provide a centralized healthcare management platform
🌟 Advantages
Secure and tamper-resistant medical records
Decentralized verification using blockchain
Reduced manual data entry through OCR
AI-assisted healthcare recommendations
Role-based access to healthcare information
Centralized management of patients and healthcare providers
Transparent medical record verification
Secure document storage using IPFS
🔮 Future Enhancements
📱 Dedicated Android / iOS application
🌐 Deployment on a public blockchain such as Polygon
🧠 Advanced AI disease prediction
📊 Healthcare analytics dashboard
🔔 Real-time notifications
💳 Blockchain-based insurance claim processing
🏥 Multi-hospital interoperability
📄 Digital health certificate generation
🔑 Decentralized identity management
📸 Screenshots

Add your project screenshots here:

![Login](screenshots/login.png)

![Patient Dashboard](screenshots/patient-dashboard.png)

![Doctor Dashboard](screenshots/doctor-dashboard.png)

![Pharmacy Dashboard](screenshots/pharmacy-dashboard.png)

![Blockchain Verification](screenshots/blockchain.png)
👨‍💻 Developer

Srivathsa JG

GitHub: @srivathsaJG

📄 License

This project was developed for educational and academic purposes.

⭐ If you found this project useful, consider giving the repository a star!


### ⚠️ One important thing

I **wouldn't paste the `Project Structure` and installation commands blindly** if your actual folders/commands are different. The README should describe your *real* implementation.

And for your GitHub/resume, I recommend the title exactly as:

# **Blockchain-Enabled Secure Healthcare System**

Then the short description:

> **A secure healthcare management platform integrating Blockchain, AI, OCR, and IPFS for tamper-resistant medical records, smart diagnosis, and pharmacy management.**

That one-liner is particularly strong for a resume. 🚀
