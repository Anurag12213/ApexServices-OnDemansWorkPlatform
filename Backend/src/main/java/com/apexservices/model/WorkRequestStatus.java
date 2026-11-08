package com.apexservices.model;

/**
 * Authoritative Work Request Status State Machine for Post and Pick Model.
 */
public enum WorkRequestStatus {
    // New Post and Pick Lifecycle
    DRAFT,
    SUBMITTED,
    QUOTATION_PENDING,
    QUOTATION_SENT,
    POSTED,                     // Published in marketplace for all eligible partners to pick
    ASSIGNED,                   // First partner accepted atomically
    PARTNER_ON_THE_WAY,         // Partner started journey to customer address
    PARTNER_ARRIVED,            // Partner reached customer site
    IN_PROGRESS,                // Service currently being executed
    AWAITING_CUSTOMER_APPROVAL, // Work completed, awaiting customer OTP verification
    COMPLETED,                  // Verified by customer completion OTP, settled
    CANCELLED,                  // Cancelled by customer or admin override
    DISPUTED,                   // Disputed by customer or partner

    // Legacy statuses retained for backwards compatibility with historical database rows
    BROADCASTED,
    IN_TRANSIT,
    ARRIVED,
    CLOSED,
    EXPIRED
}
