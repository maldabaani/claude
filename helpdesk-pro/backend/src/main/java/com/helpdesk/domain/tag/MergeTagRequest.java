package com.helpdesk.domain.tag;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MergeTagRequest(@NotNull UUID targetTagId) {}
