-- ===================================================================
-- ApexServices Database Migration V13
-- Cloudinary as Single Source of Truth for all Media Assets
-- Migrates all category banner images from external/ephemeral sources to permanent Cloudinary URLs
-- ===================================================================

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900793/apexservices/categories/cat_1_custom_carpentry.jpg' 
WHERE id = 1;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900794/apexservices/categories/cat_2_emergency_plumbing.jpg' 
WHERE id = 2;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900795/apexservices/categories/cat_3_electrical_maintenance.jpg' 
WHERE id = 3;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900796/apexservices/categories/cat_4_painting_decor.jpg' 
WHERE id = 4;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900797/apexservices/categories/cat_5_hvac_ac_service.jpg' 
WHERE id = 5;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900798/apexservices/categories/cat_6_appliance_care.jpg' 
WHERE id = 6;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900798/apexservices/categories/cat_7_deep_cleaning.jpg' 
WHERE id = 7;

UPDATE categories 
SET banner_image_url = 'https://res.cloudinary.com/tadfkray/image/upload/v1793900800/apexservices/categories/cat_8_pest_control.jpg' 
WHERE id = 8;
