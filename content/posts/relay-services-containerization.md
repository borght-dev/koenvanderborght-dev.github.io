---
title: "Relay Services: Containerizing the Legacy Edge"
subtitle: "Wrapping our Relay services in Dockerfiles, then teaching the build pipeline + installer how to live with both shapes during the migration"
date: 2025-12-13
draft: true
tags: [docker, devops, dotnet, migration]
description: "How we containerized the Relay services without breaking the existing installer-based deployments — and why the installer still has a job."
---

> *Draft.*

Relay services are our edge layer: the bits of the platform that talk to customer networks. They've shipped as installer-deployed Windows services for a decade. In December we added Dockerfiles. Both shapes now coexist in the build pipeline.

This post is about why both, not one.

## The shapes

| Shape | Where it runs | Why it exists |
|---|---|---|
| Installer (Windows service) | Customer-on-prem boxes | Some networks can't pull images |
| Container | Cloud / customer Kubernetes | Everywhere else |

## What we changed

- Added a Dockerfile per Relay service
- Added build-pipeline jobs that publish images alongside MSIs
- Updated the installer to use the **same build outputs** as the container — no source-of-truth split

## The trap we avoided

It's tempting to fork the codebase: "container Relay" and "installer Relay" with different config systems, different telemetry, different bug surfaces.

We didn't. Same code, two outputs. The deployment shape is a packaging concern, not an architectural one.

## What containerization gave us

- Faster deploys for cloud customers (image pull > MSI run)
- Sane health probes (liveness/readiness instead of WMI)
- Logs out of the box (stdout > Windows Event Log)
- A path to running Relay in our own AKS for hosted customers

## What it didn't give us

- Anything for on-prem customers who can't pull from a registry. They still need the installer.
- Magic config. Configuration is still an explicit problem; containers don't fix it.

## Lessons

- **Don't fork the codebase for deployment shape.** It's a packaging concern.
- **Same build outputs feed both packagers.** That keeps "it works in the container but not the installer" from existing.
- **Health probes are not free.** Adding them properly took longer than the Dockerfiles.
