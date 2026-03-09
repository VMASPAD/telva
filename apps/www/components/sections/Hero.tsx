"use client";
import { GridScan } from "@/components/GridScan";
import TextPressure from "@/components/TextPressure";
import React from "react";

function Hero() {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-10">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#30241C"
          gridScale={0.1}
          scanColor="#F77416"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}scanDelay={5}
        />
      </div>

      <div className="relative z-20 w-full px-10 pointer-events-none flex items-center justify-center min-h-[50vh]">
        <TextPressure
          text="Telva"
          flex
          alpha={false}
          stroke={false}
          width
          weight
          italic
          scale={false}
          textColor="#ffffff"
          strokeColor="#5227FF"
          minFontSize={100}
        />
      </div>
    </section>
  );
}

export default Hero;
