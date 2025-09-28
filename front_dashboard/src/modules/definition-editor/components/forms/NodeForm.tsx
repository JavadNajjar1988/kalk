// کامپوننت NodeForm

import React, { useState, useEffect } from 'react';
import { DefinitionNode, NodeFormData, FormErrors } from '../../types';
import { validateNode } from '../../utils/validation';
import './NodeForm.css';

interface NodeFormProps {
  node?: DefinitionNode;
  parentNode?: DefinitionNode;
  availableLevels: number[];
  onSubmit: (formData: NodeFormData) => void;
  onCancel: () => void;
  className?: string;
}

const NodeForm: React.FC<NodeFormProps> = ({
  node,
  parentNode,
  availableLevels,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<NodeFormData>({
    name: '',
    level: 1,
    parentId: undefined,
    description: '',
    coordinates: undefined,
    country: '',
    natoEquivalent: '',
    icon: '',
    specialty: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // مقداردهی اولیه فرم
  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name,
        level: node.level,
        parentId: node.parentId,
        description: node.description || '',
        coordinates: node.coordinates,
        country: node.country || '',
        natoEquivalent: node.natoEquivalent || '',
        icon: node.icon || '',
        specialty: node.specialty || ''
      });
    } else if (parentNode) {
      setFormData(prev => ({
        ...prev,
        parentId: parentNode.id,
        level: parentNode.level + 1
      }));
    }
  }, [node, parentNode]);

  const handleInputChange = (field: keyof NodeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // پاک کردن خطای مربوطه
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleCoordinatesChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { lat, lng }
    }));

    if (errors.coordinates) {
      setErrors(prev => ({
        ...prev,
        coordinates: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const validationErrors = validateNode(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <form className={`node-form ${className}`} onSubmit={handleSubmit}>
      <div className="form-header">
        <h3 className="form-title">
          {node ? 'ویرایش نود' : 'ایجاد نود جدید'}
        </h3>
      </div>

      <div className="form-body">
        {/* نام */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            نام <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="نام نود را وارد کنید"
            required
          />
          {errors.name && (
            <div className="form-error">{errors.name}</div>
          )}
        </div>

        {/* سطح */}
        <div className="form-group">
          <label htmlFor="level" className="form-label">
            سطح <span className="required">*</span>
          </label>
          <select
            id="level"
            className={`form-select ${errors.level ? 'error' : ''}`}
            value={formData.level}
            onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
            required
          >
            {availableLevels.map(level => (
              <option key={level} value={level}>
                سطح {level}
              </option>
            ))}
          </select>
          {errors.level && (
            <div className="form-error">{errors.level}</div>
          )}
        </div>

        {/* توضیحات */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            توضیحات
          </label>
          <textarea
            id="description"
            className="form-textarea"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="توضیحات نود را وارد کنید"
            rows={3}
          />
        </div>

        {/* مختصات جغرافیایی */}
        <div className="form-group">
          <label className="form-label">مختصات جغرافیایی</label>
          <div className="coordinates-inputs">
            <input
              type="number"
              className={`form-input ${errors.coordinates ? 'error' : ''}`}
              placeholder="عرض جغرافیایی"
              value={formData.coordinates?.lat || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                const lng = formData.coordinates?.lng || 0;
                handleCoordinatesChange(lat, lng);
              }}
              step="any"
            />
            <input
              type="number"
              className={`form-input ${errors.coordinates ? 'error' : ''}`}
              placeholder="طول جغرافیایی"
              value={formData.coordinates?.lng || ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                const lat = formData.coordinates?.lat || 0;
                handleCoordinatesChange(lat, lng);
              }}
              step="any"
            />
          </div>
          {errors.coordinates && (
            <div className="form-error">{errors.coordinates}</div>
          )}
        </div>

        {/* کشور */}
        <div className="form-group">
          <label htmlFor="country" className="form-label">
            کشور
          </label>
          <input
            type="text"
            id="country"
            className={`form-input ${errors.country ? 'error' : ''}`}
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="کد کشور (مثل IR)"
          />
          {errors.country && (
            <div className="form-error">{errors.country}</div>
          )}
        </div>

        {/* معادل ناتو */}
        <div className="form-group">
          <label htmlFor="natoEquivalent" className="form-label">
            معادل ناتو
          </label>
          <input
            type="text"
            id="natoEquivalent"
            className={`form-input ${errors.natoEquivalent ? 'error' : ''}`}
            value={formData.natoEquivalent}
            onChange={(e) => handleInputChange('natoEquivalent', e.target.value)}
            placeholder="مثل OF-1, OF-2"
          />
          {errors.natoEquivalent && (
            <div className="form-error">{errors.natoEquivalent}</div>
          )}
        </div>

        {/* آیکون */}
        <div className="form-group">
          <label htmlFor="icon" className="form-label">
            آیکون
          </label>
          <input
            type="text"
            id="icon"
            className={`form-input ${errors.icon ? 'error' : ''}`}
            value={formData.icon}
            onChange={(e) => handleInputChange('icon', e.target.value)}
            placeholder="آیکون (مثل ⭐, 🏠)"
          />
          {errors.icon && (
            <div className="form-error">{errors.icon}</div>
          )}
        </div>

        {/* تخصص */}
        <div className="form-group">
          <label htmlFor="specialty" className="form-label">
            تخصص
          </label>
          <input
            type="text"
            id="specialty"
            className={`form-input ${errors.specialty ? 'error' : ''}`}
            value={formData.specialty}
            onChange={(e) => handleInputChange('specialty', e.target.value)}
            placeholder="تخصص"
          />
          {errors.specialty && (
            <div className="form-error">{errors.specialty}</div>
          )}
        </div>
      </div>

      <div className="form-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          انصراف
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'در حال ذخیره...' : (node ? 'بروزرسانی' : 'ایجاد')}
        </button>
      </div>
    </form>
  );
};

export default NodeForm;
