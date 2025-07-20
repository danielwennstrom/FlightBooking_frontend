import React from "react";

const LoadingIndicator = () => {
  return (
    <>
      <div className="flex flex-col items-center my-auto">
        <div className="mx-auto my-3 size-20 border-4 border-brand-secondary border-t-brand-primary rounded-full animate-spin" />
      </div>
    </>
  );
};

export default LoadingIndicator;
