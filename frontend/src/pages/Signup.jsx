import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router";


const Signup = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh

        try {
            if (
                formData.username === "" ||
                formData.email === "" ||
                formData.password === ""
            ) {
                alert("All fields are required");
                return;
            }

            // Send data to server
            const response = await axios.post(
                "http://localhost:5000/api/v1/sign-up",
                formData
            );

            console.log(response.data);
            navigate("/");
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="text-center">Register</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                        Register
                    </button>
                </form>
                <p className="text-center mt-3">
                    Already have an account?{" "}
                    <button
                        className="btn btn-link p-0"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;
