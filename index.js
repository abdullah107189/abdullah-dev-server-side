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
        const { limit, page = 1, skip } = req.query;
        const pageNum = parseInt(page);
        const limitNum = limit ? parseInt(limit) : null;
        const skipNum = skip ? parseInt(skip) : null;

        // Get all projects first
        const allProjects = await projectsCollection.find().toArray();

        // Convert and sort dates properly
        const sortedProjects = allProjects.sort((a, b) => {
          const dateA = convertToTimestamp(a.creationDate);
          const dateB = convertToTimestamp(b.creationDate);
          return dateB - dateA; // Descending order (newest first)
        });

        // Calculate pagination
        const totalProjects = sortedProjects.length;
        const currentPage = pageNum > 0 ? pageNum : 1;

        // Handle skip and limit
        let startIndex = 0;

        if (skipNum !== null) {
          startIndex = skipNum;
        } else if (limitNum) {
          startIndex = (currentPage - 1) * limitNum;
        }

        // Apply skip/limit
        let resultProjects = sortedProjects;
        if (skipNum !== null || limitNum) {
          resultProjects = sortedProjects.slice(
            startIndex,
            limitNum ? startIndex + limitNum : undefined
          );
        }

        // Calculate pagination info
        const totalPages = limitNum ? Math.ceil(totalProjects / limitNum) : 1;
        const hasNextPage = limitNum
          ? startIndex + limitNum < totalProjects
          : false;
        const hasPrevPage = startIndex > 0;

        res.json({
          success: true,
          data: resultProjects,
          pagination: {
            currentPage: currentPage,
            totalPages: totalPages,
            totalProjects: totalProjects,
            projectsPerPage: limitNum,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? currentPage + 1 : null,
            prevPage: hasPrevPage ? currentPage - 1 : null,
            showing: `${startIndex + 1}-${Math.min(
              startIndex + (limitNum || totalProjects),
              totalProjects
            )} of ${totalProjects}`,
          },
        });
      } catch (error) {
        console.error("Sorting error:", error);
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
