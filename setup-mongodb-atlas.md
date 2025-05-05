# Setting up MongoDB Atlas

Follow these steps to set up a free MongoDB Atlas cluster for your Code Snippet Manager application:

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account

## 2. Create a Cluster

1. After signing in, click "Build a Database"
2. Choose the "FREE" tier (M0)
3. Select your preferred cloud provider and region
4. Click "Create Cluster"

## 3. Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and password (remember these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## 4. Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development purposes)
4. Click "Confirm"

## 5. Get Your Connection String

1. Go back to your cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace the placeholder in your `.env` file with your actual connection string

## 6. Update Your .env File

Replace the placeholder in your `.env` file with your actual connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/code-snippets?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, and `<cluster-url>` with your actual values.

## 7. Start Your Application

Now you can start your application:

```bash
cd backend
npm run dev
```

Your application should now connect to MongoDB Atlas successfully! 