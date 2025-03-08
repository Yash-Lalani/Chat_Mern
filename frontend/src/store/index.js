import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./auth";
const store =configureStore({
    reducer:{
        auth:authReducer,
        // Add other reducers here...
    },
})

export default store;