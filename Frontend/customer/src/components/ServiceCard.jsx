import React, { useState } from "react";
import "./ServiceCard.css";
import { CategoryIcon } from "./CategoryIcon";

export const ServiceCard = ({
  category,
  id,
  name,
  description,
  image,
  icon,
  popular,
  rating,
  reviews,
  price,
  serviceCount,
  onView,
  onBook,
  onSelect,
  onBookNow
}) => {
  // Support both passing single `category` object or individual props
  const catId = id || category?.id || category?.slug;
  const catName = name || category?.name || "Service";
  const catRawImage = image || category?.imageUrl || category?.bannerImageUrl || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000";
  const catBadge = popular !== undefined ? popular : (category?.badge || category?.tag || (category?.tags && category.tags.includes('popular') ? 'POPULAR' : null));
  const catRating = rating || category?.rating || "4.8";
  const catReviews = reviews || category?.reviewCount || "980";
  const rawPrice = price || category?.startingPrice || "₹399";
  const formattedPrice = String(rawPrice).startsWith('From') 
    ? rawPrice 
    : String(rawPrice).startsWith('₹') 
      ? `From ${rawPrice}` 
      : `From ₹${rawPrice}`;
  const catCount = serviceCount !== undefined ? serviceCount : (category?.serviceCount || (category?.subservices ? category.subservices.length : 14));

  // Subservices / description preview
  const subservicesText = category?.subservices && category.subservices.length > 0
    ? category.subservices.slice(0, 3).map((s) => s.name).join(" • ") + (category.subservices.length > 3 ? " • More" : "")
    : (description || category?.description || "Furniture Assembly & Joinery • Door Hanging • More");

  const [imgError, setImgError] = useState(false);
  const fallbackImg = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
  const finalImage = !imgError && catRawImage ? catRawImage : fallbackImg;

  // Previous redirection: View Scope & Book -> Step 1 (Scope & Selection)
  const handlePreviousRedirect = (e) => {
    if (e) e.stopPropagation();
    if (onView) {
      onView(category || catName, 1);
    } else if (onBook) {
      onBook(catName, 1);
    }
  };

  // Next redirection: BOOK NOW -> Step 2 (Problem Diagnosis / Direct Booking)
  const handleNextRedirect = (e) => {
    if (e) e.stopPropagation();
    if (onBook) {
      onBook(catName, 2);
    } else if (onBookNow) {
      onBookNow(catName, 2);
    } else if (onView) {
      onView(category || catName, 2);
    }
  };

  return (
    <div className="service-card" onClick={handleNextRedirect} style={{ cursor: 'pointer' }}>

      {/* Image Section */}
      <div className="service-image">
        <img
          src={finalImage}
          alt={catName}
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {catBadge && (
          <span className="popular-badge">
            🔥 {typeof catBadge === 'string' ? catBadge.toUpperCase() : 'POPULAR'}
          </span>
        )}

        <button 
          type="button"
          className="image-arrow"
          onClick={handleNextRedirect}
          aria-label={`Book ${catName}`}
        >
          ↗
        </button>
      </div>

      {/* Details Section */}
      <div className="service-content">

        <div className="service-heading">
          <div className="service-icon">
            {icon ? (
              typeof icon === 'string' ? icon : icon
            ) : (
              <CategoryIcon
                icon={category?.icon}
                iconName={category?.iconName}
                iconValue={category?.icon?.iconValue || category?.iconValue}
                className="w-7 h-7 text-white"
                imgClassName="w-7 h-7 object-contain"
              />
            )}
          </div>

          <div className="heading-divider" />

          <div className="service-title">
            <h2>{catName}</h2>
            <p title={subservicesText}>
              {subservicesText}
            </p>
          </div>
        </div>

        {/* Service Information Bar with Dividers */}
        <div className="service-info">

          <div className="info-item rating">
            <span className="star">★</span>
            <strong>{catRating}</strong>
            <span className="muted">({catReviews} reviews)</span>
          </div>

          <div className="info-divider" />

          <div className="info-item price">
            {formattedPrice}
          </div>

          <div className="info-divider" />

          <div className="info-item count">
            {catCount} services
          </div>

        </div>

        {/* Action Buttons: Direct Previous & Next Redirection */}
        <div className="service-actions">
          <button 
            type="button"
            className="scope-btn"
            onClick={handlePreviousRedirect}
          >
            View Scope & Book
          </button>

          <button 
            type="button"
            className="book-btn"
            onClick={handleNextRedirect}
          >
            BOOK NOW <span>→</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ServiceCard;
