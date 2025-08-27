import React from "react";

function Homescreen() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to Resume Builder</h1>
      <p>Create and manage your professional resume easily.</p>
      <a href="/auth">Get Started</a>
    </div>
  );
}

export default Homescreen;
