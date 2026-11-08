-- ===================================================================
-- ApexServices Database Migration V14
-- Support TEXT for Category Banner Images
-- Allows both long Cloudinary URLs and resilient fallback images
-- ===================================================================

ALTER TABLE categories 
MODIFY COLUMN banner_image_url TEXT NULL;
