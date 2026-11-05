package com.apexservices.service;

import com.apexservices.dto.CategoryRequestDto;
import com.apexservices.model.Icon;
import com.apexservices.repository.IconRepository;
import com.apexservices.security.InputSanitizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class IconService {

    private final IconRepository iconRepository;

    public List<Icon> getAllIcons() {
        return iconRepository.findAll();
    }

    @Transactional
    public Icon addIcon(Map<String, Object> body) {
        String name = (String) body.getOrDefault("name", "Custom Icon");
        String iconType = (String) body.getOrDefault("iconType", "CUSTOM");
        String iconValue = (String) body.get("iconValue");
        if (iconValue == null || iconValue.isBlank()) {
            throw new IllegalArgumentException("Icon value is required");
        }
        Icon icon = Icon.builder()
                .name(name)
                .iconType(iconType)
                .iconValue(iconValue)
                .build();
        return iconRepository.save(icon);
    }

    @Transactional
    public Icon resolveIcon(CategoryRequestDto body, String categoryName) {
        if (body.getCustomIconValue() != null && !body.getCustomIconValue().isBlank()) {
            String customValue = body.getCustomIconValue();
            String iconName = body.getCustomIconName() != null && !body.getCustomIconName().isBlank()
                    ? InputSanitizer.sanitize(body.getCustomIconName())
                    : categoryName + " Icon";
            Icon icon = Icon.builder()
                    .name(iconName)
                    .iconType("CUSTOM")
                    .iconValue(customValue)
                    .build();
            return iconRepository.save(icon);
        } else if (body.getIconId() != null) {
            try {
                return iconRepository.findById(body.getIconId()).orElse(null);
            } catch (Exception ignored) {
                return null;
            }
        } else if (body.getIconName() != null && !body.getIconName().isBlank()) {
            String iconName = InputSanitizer.sanitize(body.getIconName());
            return iconRepository.findByIconValue(iconName)
                    .orElseGet(() -> iconRepository.save(Icon.builder().name(iconName).iconType("SYSTEM").iconValue(iconName).build()));
        }
        return null;
    }
}
