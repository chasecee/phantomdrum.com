"use client";

import type { MutableRefObject } from "react";
import type { Group } from "three";

export type GroupRef = MutableRefObject<Group | null>;
export type Rotation = { x: number; y: number; z: number };

