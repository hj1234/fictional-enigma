"use client";
import { useState, useEffect, useRef } from 'react';

const TutorialOverlay = ({ steps, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (steps.length === 0) return;
    
    const step = steps[currentStep];
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        setHighlightedElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (steps.length === 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const elementRect = highlightedElement?.getBoundingClientRect();
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  // Calculate tooltip position
  let tooltipTop = '50%';
  let tooltipLeft = '50%';
  let tooltipTransform = 'translate(-50%, -50%)';
  
  if (elementRect) {
    // Position tooltip below element if there's space, otherwise above
    if (elementRect.bottom + 200 < windowHeight) {
      tooltipTop = `${elementRect.bottom + 20}px`;
      tooltipLeft = `${Math.max(20, Math.min(elementRect.left, windowWidth - 400))}px`;
      tooltipTransform = 'none';
    } else if (elementRect.top - 200 > 0) {
      tooltipTop = `${elementRect.top - 200}px`;
      tooltipLeft = `${Math.max(20, Math.min(elementRect.left, windowWidth - 400))}px`;
      tooltipTransform = 'none';
    } else {
      // Center if no good position
      tooltipTop = '50%';
      tooltipLeft = '50%';
      tooltipTransform = 'translate(-50%, -50%)';
    }
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dark overlay with cutout using box-shadow technique */}
      {elementRect && (
        <>
          {/* Top overlay */}
          <div 
            className="absolute bg-black/85 pointer-events-auto"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${elementRect.top}px`
            }}
          />
          {/* Bottom overlay */}
          <div 
            className="absolute bg-black/85 pointer-events-auto"
            style={{
              top: `${elementRect.bottom}px`,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
          {/* Left overlay */}
          <div 
            className="absolute bg-black/85 pointer-events-auto"
            style={{
              top: `${elementRect.top}px`,
              left: 0,
              width: `${elementRect.left}px`,
              height: `${elementRect.height}px`
            }}
          />
          {/* Right overlay */}
          <div 
            className="absolute bg-black/85 pointer-events-auto"
            style={{
              top: `${elementRect.top}px`,
              left: `${elementRect.right}px`,
              right: 0,
              height: `${elementRect.height}px`
            }}
          />
          {/* Highlight border around element */}
          <div
            className="absolute pointer-events-none border-2 border-amber-500 rounded shadow-[0_0_20px_rgba(245,158,11,0.5)]"
            style={{
              top: `${elementRect.top - 2}px`,
              left: `${elementRect.left - 2}px`,
              width: `${elementRect.width + 4}px`,
              height: `${elementRect.height + 4}px`
            }}
          />
        </>
      )}
      
      {/* Fallback overlay if no element */}
      {!elementRect && (
        <div className="absolute inset-0 bg-black/85 pointer-events-auto" />
      )}
      
      {/* Tooltip */}
      {step.tooltip && (
        <div 
          className="absolute pointer-events-auto bg-gray-900 border-2 border-amber-500 p-4 rounded-lg max-w-sm shadow-2xl"
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            transform: tooltipTransform
          }}
        >
          <div className="text-amber-500 font-bold text-sm mb-2">
            {step.title || `Step ${currentStep + 1} of ${steps.length}`}
          </div>
          <div className="text-white text-xs mb-4 whitespace-pre-line leading-relaxed">
            {step.content}
          </div>
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrevious}
                  className="px-3 py-1 bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 text-xs transition-colors"
                >
                  Previous
                </button>
              )}
              <button 
                onClick={handleNext}
                className="px-3 py-1 bg-amber-900 text-amber-200 border border-amber-700 hover:bg-amber-800 text-xs font-bold transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
            <button 
              onClick={onSkip}
              className="px-3 py-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Skip Tutorial
            </button>
          </div>
          <div className="mt-3 text-center">
            <div className="text-gray-600 text-[10px]">
              {currentStep + 1} / {steps.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialOverlay;

