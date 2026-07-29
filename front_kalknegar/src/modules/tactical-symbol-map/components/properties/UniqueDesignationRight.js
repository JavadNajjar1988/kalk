/* eslint-disable react/prop-types */
import React from "react";
import textProperty from "./textProperty";
import { getBoundaryDesignation } from "./boundaryFeatureProperties";

const TextProperty = textProperty({
  label: "Unique Designation (Right)",
  get: (feature) => getBoundaryDesignation("right", feature) || null,
  set: (value) => (feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      t1: value,
    },
  }),
});

export default (props) => {
  return <TextProperty {...props} />;
};
