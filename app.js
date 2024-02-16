const express = require("express");
const mongoose = require("mongoose");

const app = express();


const url = 'mongodb://localhost:27017/my_db';


mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");

     
        const userSchema = new mongoose.Schema({
            name: String,
            age: Number,
            country: String
        });

        
        const User = mongoose.model('User', userSchema);

       
        User.insertMany([
            { name: "John", age: 30, country: "USA" },
            { name: "Alice", age: 25, country: "Canada" },
            { name: "Bob", age: 35, country: "USA" },
            { name: "Emma", age: 28, country: "UK" },
            { name: "Michael", age: 40, country: "Canada" }
        ]).then(() => {
            console.log("data inserted");

         
            app.get('/', async (req, res) => {
                try {
                    // Perform aggregation
                    const aggregationResult = await User.aggregate([
                        {
                            $group: {
                                _id: null,
                                totalUsers: { $sum: 1 },
                                averageAge: { $avg: "$age" },
                                usersByCountry: {
                                    $push: {
                                        country: "$country",
                                        count: 1
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalUsers: 1,
                                averageAge: 1,
                                usersByCountry: {
                                    $reduce: {
                                        input: "$usersByCountry",
                                        initialValue: [],
                                        in: {
                                            $cond: {
                                                if: { $in: ["$$this.country", "$$value.country"] },
                                                then: {
                                                    $map: {
                                                        input: "$$value",
                                                        as: "v",
                                                        in: {
                                                            $cond: {
                                                                if: { $eq: ["$$v.country", "$$this.country"] },
                                                                then: {
                                                                    country: "$$v.country",
                                                                    count: { $add: ["$$v.count", "$$this.count"] }
                                                                },
                                                                else: "$$v"
                                                            }
                                                        }
                                                    }
                                                },
                                                else: { $concatArrays: ["$$value", ["$$this"]] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]).exec();

                    res.json(aggregationResult);
                } catch (error) {
                    console.log("Error performing aggregation:", error);
                    res.status(500).send("Error performing aggregation");
                }
            });

            
            app.listen(3000, () => {
                console.log('Server is running on port 3000');
            });
        }).catch((err) => {
            console.error("Error inserting sample data:", err);
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });
