# Setting up MongoDB Locally

Follow these steps to install and set up MongoDB Community Edition on your local machine:

## Windows Installation

1. Download MongoDB Community Server from the [official website](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. Choose "Complete" installation
4. Install MongoDB Compass (the GUI tool) when prompted
5. Complete the installation

## Start MongoDB Service

### Option 1: Using MongoDB as a Service (Recommended)

1. MongoDB should be installed as a Windows service and should start automatically
2. To verify, open Services (Win+R, type "services.msc")
3. Look for "MongoDB Server" and make sure it's running

### Option 2: Manual Start

If the service isn't running, you can start it manually:

1. Open Command Prompt as Administrator
2. Run the following command:
   ```
   net start MongoDB
   ```

## Verify Installation

1. Open MongoDB Compass
2. Connect to the default connection string: `mongodb://localhost:27017`
3. You should see the MongoDB server running

## Update Your .env File

Once MongoDB is running, update your `.env` file to use the local MongoDB instance:

```
MONGODB_URI=mongodb://localhost:27017/code-snippets
```

## Start Your Application

Now you can start your application:

```bash
cd backend
npm run dev
```

Your application should now connect to your local MongoDB instance successfully! 