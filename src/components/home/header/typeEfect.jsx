import React from "react";
import Typewriter from "typewriter-effect";

const TypewriterComponent = () => {
  return (
    <div className="notranslate mt-5 text-3xl font-bold text-theme-primary">
      <Typewriter
        options={{
          strings: ["Web开发", "前端开发", "后端开发", "UX/UI设计"],
          autoStart: true,
          loop: true,
        }}
      />
    </div>
  );
};

export default TypewriterComponent;