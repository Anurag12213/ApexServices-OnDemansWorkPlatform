package com.apexservices.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

import java.io.InputStream;

@Configuration
public class EtagFilterConfig {

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
        // Custom ShallowEtagHeaderFilter that respects and preserves explicit controller-generated version ETags
        ShallowEtagHeaderFilter filter = new ShallowEtagHeaderFilter() {
            @Override
            protected boolean isEligibleForEtag(HttpServletRequest request, HttpServletResponse response, int responseStatusCode, InputStream is) {
                // If controller already computed a fast, zero-query version ETag, do not overwrite it with body hash
                if (response.containsHeader("ETag")) {
                    return false;
                }
                return super.isEligibleForEtag(request, response, responseStatusCode, is);
            }
        };

        FilterRegistrationBean<ShallowEtagHeaderFilter> filterRegistrationBean =
                new FilterRegistrationBean<>(filter);
        filterRegistrationBean.addUrlPatterns("/api/data", "/api/settings", "/api/categories", "/api/slides", "/api/reviews", "/api/catalog/*");
        filterRegistrationBean.setName("etagFilter");
        filterRegistrationBean.setOrder(1);
        return filterRegistrationBean;
    }
}
