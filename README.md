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
│   │   ├── assets/
│   │   └── App.js
├── .env
└── README.md

```

## Installation

Clone the Repository

```bash
git clone https://github.com/eemanDigital/case-master-app
cd casemaster-app
```

## Install Dependencies

Navigate to both the backend and frontend folders to install the necessary dependencies.

- Backend:

```bash
cd backend
npm install

```

## Install Dependencies

- frontend:

```bash
cd frontend
npm install

```

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```dotenv
# Server Configuration
PORT=3000

# MongoDB Configuration
DATABASE=mongodb+srv://fakeuser:fakepassword@cluster0.fake.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DATABASE_PASSWORD=fakepassword
DATABASE_LOCAL=mongodb://127.0.0.1:27017/fake-database

# JWT Configuration
JWT_SECRET=fake_jwt_secret
REFRESH_TOKEN_SECRET=fake_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=90m
REFRESH_TOKEN_COOKIE_EXPIRES_IN=7d

# Mailtrap Configuration
EMAIL_USERNAME=fakeusername
EMAIL_PASSWORD=fakepassword
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM=fakeuser@fakeemail.com

# Additional Configuration
SENDINBLUE_USERNAME=fake_sendinblue_username
SENDINBLUE_PASSWORD=fake_sendinblue_password
SENDINBLUE_EMAIL=fake_sendinblue_email
FRONTEND_URL=fake_frontend_url
GOOGLE_CLIENT_ID=fake_google_client_id
GOOGLE_CLIENT_SECRET_ID=fake_google_client_secret_id
REDIRECT_URI=fake_redirect_uri
GOOGLE_REFRESH_TOKEN=fake_google_refresh_token
CLOUD_NAME=fake_cloud_name
CLOUD_API_KEY=fake_cloud_api_key
CLOUD_SECRET=fake_cloud_secret
CRYPTR_SECRET_KEY=fake_cryptr_secret_key
COMPANY_NAME=fake_company_name
DEVELOPER_EMAIL=fake_developer_email
TEMP_PASSWORD=fake_temp_password
```

Replace with the actual values.

## Start the Application

To start the application, you need to start both the backend and frontend servers.

### Backend

```bash
cd backend
npm run start
```

### Frontend

```bash
cd frontend
npm run dev
```

## Access the Application

Visit [http://localhost:3000](http://localhost:3000) in your browser to view the backend. The frontend will be running on [http://localhost:5173](http://localhost:5173).

## Screenshots

## Screenshots

Here are some screenshots of the application:

![Screenshot 1](screenshots/screenshot1.png)
![Screenshot 2](screenshots/screenshot2.png)

<!-- Add your screenshots here -->

## Challenges Faced

- **RBAC Implementation**: Ensuring secure and flexible access control based on user roles. Solved by integrating a custom RBAC module with the authentication system.
- **Complex Form Management**: Using Ant Design to handle dynamic and complex form inputs efficiently.
- **Data Aggregation for Charts**: Streamlining data for case categorization, payment tracking, and case listing using MongoDB’s aggregation.
- **Automated Email Notifications**: Integrating Nodemailer with dynamic email templates for seamless notification management.

## Outcomes

- Increased productivity and reduced administrative overhead for law firms.
- Improved client engagement with real-time updates through a client-facing dashboard.
- Enhanced data security and compliance with two-factor authentication.

## Future Enhancements

- **Automated Case Status Update via SMS**: Notify clients of case progress directly on their mobile devices.
- **Advanced Analytics Dashboard**: Add more data-driven insights for law firms to improve case management.
- **Multi-language Support**: Expand the platform's accessibility for law firms globally.

## Contributions

Contributions to CaseMaster are welcome. Please fork the repository and submit a pull request with any new features or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions, suggestions, or feedback, please reach out:

**Lukman Asinmi**

- [LinkedIn](https://www.linkedin.com/in/lukman-asinmi-359512257)
- [Email](mailto:asinmilukman@gmail.com)

Let’s streamline case management together!
