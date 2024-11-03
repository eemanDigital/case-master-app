# CaseMaster - Case Management Solution for Law Firms

CaseMaster is a comprehensive case management application designed specifically for law firms. It helps streamline case tracking, client coordination, document handling, billing, reporting, and more, all within a single platform. With features like Role-Based Access Control (RBAC), dynamic reporting, calendar management, and a client-facing dashboard, CaseMaster improves productivity and enhances client transparency.

---

## Features

- **Case Tracking**: Organize and track all case-related activities, milestones, and deadlines.
- **Client & Staff Coordination**: Manage clients, assign tasks to staff, and ensure seamless communication.
- **Document Handling**: Upload, store, and manage legal documents securely.
- **Billing & Invoicing**: Generate invoices and manage payments.
- **Role-Based Access Control (RBAC)**: Define roles and control access to different features based on user roles.
- **Calendar Management**: Schedule important events, appointments, and deadlines.
- **Dynamic Reporting**: Generate reports for cases, billing, and other key metrics.
- **Client-Facing Dashboard**: Provide clients with a secure dashboard to view case updates.
- **Automated Emails**: Send reminders, notifications, and other important emails automatically.
- **Two-Factor Authentication (2FA)**: Enhance security with an additional layer of authentication.
- **Password Management**: Allow users to change and reset their passwords securely.
- **Advanced Search & Filter**: Quickly find cases, clients, or documents based on specific criteria.
- **Charts & Data Visualization**: Gain insights into firm performance through Recharts integration.
  
---

## Technology Stack

- **Frontend**: React, Redux, Tailwind CSS, Ant Design
- **Backend**: Node.js, Express, MongoDB
- **Email Integration**: Nodemailer with SendInBlue (customizable)
- **Authentication**: JWT-based authentication with Google OAuth support
- **Data Visualization**: Recharts for displaying interactive data and charts

---

## Project Structure

The project follows the standard MERN (MongoDB, Express, React, Node.js) stack structure:

```plaintext
CaseMaster/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── data/
│   │   ├── redux/
│   │   ├── utils/
│   │   ├── tests/
│   │   └── App.js
├── .env
└── README.md
