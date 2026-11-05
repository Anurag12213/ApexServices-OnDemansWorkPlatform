-- ===================================================================
-- ApexServices Database Migration V12
-- Authoritative Category Banner Image URLs in MySQL
-- Ensures MySQL is the single source of truth for all service images
-- ===================================================================

ALTER TABLE categories 
ADD COLUMN banner_image_url VARCHAR(1000) NULL AFTER tag;

-- Seed baseline high-resolution CDN images for default categories
UPDATE categories SET banner_image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' WHERE id = 1 AND banner_image_url IS NULL;
UPDATE categories SET banner_image_url = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80' WHERE id = 2 AND banner_image_url IS NULL;
UPDATE categories SET banner_image_url = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' WHERE id = 3 AND banner_image_url IS NULL;
UPDATE categories SET banner_image_url = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80' WHERE id = 4 AND banner_image_url IS NULL;
UPDATE categories SET banner_image_url = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' WHERE id = 5 AND banner_image_url IS NULL;
UPDATE categories SET banner_image_url = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' WHERE id = 6 AND banner_image_url IS NULL;
