# Nogna Billing Installation Guide

Nogna Billing is a native WordPress billing application with a PHP backend and a React frontend.

## Requirements

- WordPress 6.4 or newer
- PHP 8.1 or newer
- MySQL 5.7+ or MariaDB 10.4+
- A logged-in WordPress user
- Node.js 18+ and npm 9+ only when building from source

## Option 1: Install a ready-built plugin ZIP

Use this option when the ZIP already contains:

\`assets/build/nogna-admin.js\`
\`assets/build/nogna-admin.css\`

1. Open WordPress admin.
2. Go to **Plugins → Add New Plugin**.
3. Select **Upload Plugin**.
4. Choose the Nogna Billing ZIP file.
5. Click **Install Now**.
6. Activate **Nogna Billing**.
7. Open:

\`http://your-wordpress-site/nogna-dashboard/\`

For a local Docker installation:

\`http://localhost:8080/nogna-dashboard/\`

The plugin creates the Nogna Dashboard page during activation.

## Option 2: Build the plugin from the GitHub source

Use this option when downloading the repository directly from GitHub.

### 1. Download the repository

Using Git:

\`\`\`bash
cd ~/Downloads
git clone https://github.com/joel-mwakasege/nogna-wordpress.git
cd nogna-wordpress
\`\`\`

Or download the repository ZIP from GitHub and extract it.

### 2. Check Node.js and npm

\`\`\`bash
node --version
npm --version
\`\`\`

Node.js 18 or newer is recommended.

If npm is not installed on Ubuntu:

\`\`\`bash
sudo apt update
sudo apt install nodejs npm
\`\`\`

### 3. Install frontend dependencies

Run this command from the plugin root, where \`package.json\` is located:

\`\`\`bash
npm install
\`\`\`

### 4. Build the React frontend

\`\`\`bash
npm run build
\`\`\`

A successful build creates:

\`\`\`text
assets/build/nogna-admin.js
assets/build/nogna-admin.css
\`\`\`

The React frontend will not replace the older PHP dashboard until these built files exist.

### 5. Create an upload ZIP

From the directory above the plugin folder:

\`\`\`bash
cd ..
zip -r nogna-wordpress.zip nogna-wordpress \\
  -x "nogna-wordpress/node_modules/*" \\
  -x "nogna-wordpress/.git/*"
\`\`\`

The ZIP should contain the plugin folder and the built frontend files:

\`\`\`text
nogna-wordpress/
├── nogna-billing.php
├── includes/
├── assets/
│   └── build/
│       ├── nogna-admin.js
│       └── nogna-admin.css
├── package.json
└── ...
\`\`\`

### 6. Upload to WordPress

1. Deactivate the previous Nogna Billing version.
2. Delete the old plugin folder if WordPress refuses to replace it.
3. Go to **Plugins → Add New Plugin → Upload Plugin**.
4. Upload \`nogna-wordpress.zip\`.
5. Activate the plugin.
6. Open the dashboard URL.

## Local Docker installation

If WordPress is running at:

\`http://localhost:8080\`

the REST health endpoint is:

\`http://localhost:8080/wp-json/nogna/v1/health\`

The dashboard is:

\`http://localhost:8080/nogna-dashboard/\`

You must be logged in to WordPress before opening the dashboard.

## First-use flow

1. Log in to WordPress.
2. Open the Nogna Dashboard.
3. Open **My Company**.
4. Create a company workspace.
5. Select the company from the left-side company list.
6. Open **Customers**.
7. Add the first customer.

## Updating the plugin

Each repository release has a version number in:

- \`nogna-billing.php\`
- \`readme.txt\`

For example:

\`1.9.0.1\`

When installing a new version:

1. Download the latest source.
2. Run \`npm install\`.
3. Run \`npm run build\`.
4. Create a new ZIP.
5. Deactivate and delete the old plugin if necessary.
6. Upload and activate the new ZIP.
7. Hard-refresh the browser with **Ctrl + Shift + R**.

## Troubleshooting

### The React interface does not appear

Confirm that these files exist inside the uploaded plugin:

\`\`\`text
assets/build/nogna-admin.js
assets/build/nogna-admin.css
\`\`\`

Then confirm that the uploaded plugin version is newer than the installed version.

### The dashboard page does not exist

Create a WordPress page with this shortcode:

\`\`\`text
[nogna_dashboard]
\`\`\`

Then publish the page and open it while logged in.

### The dashboard shows no company

Open **My Company** and create a workspace before adding customers.

### REST API returns an authentication error

Make sure:

- You are logged in to WordPress.
- You are opening the dashboard from the same WordPress site.
- The REST API is not blocked by a security plugin.
- The WordPress REST URL works:

\`http://localhost:8080/wp-json/nogna/v1/health\`

### WordPress keeps showing the old interface

1. Confirm the plugin version changed.
2. Confirm \`assets/build/\` exists in the uploaded plugin.
3. Deactivate/reactivate the plugin.
4. Hard-refresh with **Ctrl + Shift + R**.
5. Clear any page or browser cache.

## Development commands

From the plugin root:

\`\`\`bash
npm install
npm run build
\`\`\`

The current frontend build is production-oriented. The PHP backend and REST API remain the source of truth for authentication, permissions, company isolation, and financial operations.
