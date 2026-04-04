package com.backend.models.subject;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SubjectResponseModel {
    private Long id;
    private String name;
    private Integer lecture;
    private Integer tutorial;
    private Integer practical;
}
