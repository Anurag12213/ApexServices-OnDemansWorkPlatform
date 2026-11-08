package com.apexservices;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class CheckForeignKeysAndCleanUsersTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void inspectAndClean() {
        System.out.println("=== EXECUTING SAFE CASCADE DELETION FOR 1146, 1147, 1148, 1149, 1150 ===");
        
        try {
            int dReviews = jdbcTemplate.update("DELETE FROM reviews WHERE customer_id IN (1146,1147,1148,1149,1150) OR assigned_partner_id IN (1146,1147,1148,1149,1150)");
            System.out.println("Deleted reviews: " + dReviews);
        } catch (Exception e) {
            System.out.println("Reviews cleanup note: " + e.getMessage());
        }

        try {
            int dWorkReqs = jdbcTemplate.update("DELETE FROM work_requests WHERE customer_id IN (1146,1147,1148,1149,1150) OR assigned_partner_id IN (1146,1147,1148,1149,1150)");
            System.out.println("Deleted work_requests: " + dWorkReqs);
        } catch (Exception e) {
            System.out.println("Work_requests cleanup note: " + e.getMessage());
        }

        try {
            int dProfiles = jdbcTemplate.update("DELETE FROM partner_profiles WHERE user_id IN (1146,1147,1148,1149,1150)");
            System.out.println("Deleted partner_profiles: " + dProfiles);
        } catch (Exception e) {
            System.out.println("Partner profiles cleanup note: " + e.getMessage());
        }

        int deletedUsers = jdbcTemplate.update("DELETE FROM users WHERE id IN (1146, 1147, 1148, 1149, 1150)");
        System.out.println("=== RESULT: SUCCESSFULLY DELETED USERS COUNT: " + deletedUsers + " ===");

        List<Map<String, Object>> remaining = jdbcTemplate.queryForList("SELECT id, email, role FROM users ORDER BY id ASC");
        System.out.println("=== CURRENT REMAINING USERS IN DATABASE (" + remaining.size() + ") ===");
        for (Map<String, Object> u : remaining) {
            System.out.println("REMAINING: ID=" + u.get("id") + " | " + u.get("email") + " | " + u.get("role"));
        }
    }
}
