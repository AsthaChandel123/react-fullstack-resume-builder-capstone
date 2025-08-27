import React from "react"; 
import {Route, Routes} from "react-router-dom";
import {HomeScreen, Aunthentication} from "../pages"
const app= () => { 
return <Suspense fallback ={<div>Loading...</div>}>
    <Routes>
        <Route path="/*" element={<HomeScreen />}/>
        <Route path="/auth" element={<Aunthentication />} />
    </Routes>
</Suspense>;
};

export default app;