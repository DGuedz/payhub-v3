"use client";
import React from "react";
import TestEnvironment from "../../../components/TestEnvironment";
import { Toaster } from "react-hot-toast";

export default function TestPage() {
  return (
    <>
      <Toaster position="top-right" />
      <TestEnvironment />
    </>
  );
}
