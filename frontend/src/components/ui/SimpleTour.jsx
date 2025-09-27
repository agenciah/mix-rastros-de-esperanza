// RUTA: src/components/ui/SimpleTour.jsx
import React, { useState, useLayoutEffect } from 'react';

export const SimpleTour = ({ steps, run, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useLayoutEffect(() => {
    if (run && steps[currentStep]) {
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Si no encuentra el elemento, avanza al siguiente paso o termina
        handleNext();
      }
    }
  }, [currentStep, run, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    setTargetRect(null);
    if (onComplete) onComplete();
  };

  if (!run || !targetRect) return null;

  const currentStepData = steps[currentStep];

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`, transform: `translate(${targetRect.left}px, ${targetRect.top}px)`, width: `${targetRect.width}px`, height: `${targetRect.height}px`, borderRadius: '4px', transition: 'all 0.3s ease', zIndex: 1000, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: `${targetRect.bottom + 10}px`, left: `${targetRect.left}px`, zIndex: 1001 }} className="bg-white p-4 rounded-lg shadow-2xl max-w-xs animate-fade-in">
        <p className="text-sm text-gray-700">{currentStepData.content}</p>
        <div className="flex justify-end mt-4">
          <button onClick={handleNext} className="bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm hover:bg-blue-700">
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
};