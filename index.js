require("dotenv").config();
const express = require("express");
const app = express();
const port = 4545;
const cors = require("cors");

// middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fx40ttv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const database = client.db("abdullah107189");
    const projectsCollection = database.collection("projects");

    app.get("/", (req, res) => {
      res.send("Hello World!");
    });
    app.get("/projects", async (req, res) => {
      try {
        const { page = 1, limit = 8, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Limit max 50

        // Get all projects
        const allProjects = await projectsCollection.find().toArray();

        // Filter by search if provided
        let filteredProjects = allProjects;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredProjects = allProjects.filter(
            (project) =>
              project.name?.toLowerCase().includes(searchLower) ||
              project.description?.toLowerCase().includes(searchLower) ||
              project.technologies?.some((tech) =>
                tech.toLowerCase().includes(searchLower)
              )
          );
        }

        // Sort by date
        const sortedProjects = filteredProjects.sort((a, b) => {
          const dateA = convertToTimestamp(a.creationDate);
          const dateB = convertToTimestamp(b.creationDate);
          return dateB - dateA;
        });

        // Calculate pagination
        const totalProjects = sortedProjects.length;
        const totalPages = Math.ceil(totalProjects / limitNum);
        const currentPage = Math.min(pageNum, totalPages);
        const startIndex = (currentPage - 1) * limitNum;
        const endIndex = Math.min(startIndex + limitNum, totalProjects);

        // Get projects for current page
        const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

        res.json({
          success: true,
          data: paginatedProjects,
          pagination: {
            currentPage,
            totalPages,
            totalProjects,
            projectsPerPage: limitNum,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            prevPage: currentPage > 1 ? currentPage - 1 : null,
            startIndex: startIndex + 1,
            endIndex,
            search: search || null,
          },
        });
      } catch (error) {
        console.error("Projects fetch error:", error);
        res.status(500).json({
          success: false,
          error: "Internal server error",
        });
      }
    });
    // Helper function to convert "DD-MM-YYYY" to timestamp
    function convertToTimestamp(dateString) {
      try {
        const [day, month, year] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day).getTime();
      } catch (error) {
        return 0;
      }
    }

    app.get("/projects/:id", async (req, res) => {
      try {
        const { id } = req.params;
        // Validate ID format
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            error: "Invalid project ID format",
            message: "Please provide a valid project ID",
          });
        }

        const query = { _id: new ObjectId(id) };
        const project = await projectsCollection.findOne(query);

        // Success response
        res.status(200).json(project);
      } catch (error) {
        console.error("Error fetching project:", error);

        // Handle different types of errors
        if (error.name === "CastError") {
          return res.status(400).json({
            success: false,
            error: "Invalid ID format",
            message: "The provided ID is not valid",
          });
        }

        res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve project",
        });
      }
    });
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
