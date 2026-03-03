REGISTRY ?= docker.io/blockcell-labs
IMAGE ?= blockcell
BUILDER ?= blockcell

PLATFORMS ?= amd64 arm64
PLATFORM_ALL ?= linux/amd64,linux/arm64

buildx:
	docker buildx build \
		--builder $(BUILDER) \
		--platform $(PLATFORM_ALL) \
		-f Dockerfile.full \
		-t $(REGISTRY)/$(IMAGE):latest \
		--push .

build-%:
	docker buildx build \
		--builder $(BUILDER) \
		--platform linux/$* \
		-f Dockerfile.full \
		-t $(REGISTRY)/$(IMAGE):$* \
		--push .

run-docker-bash:
	docker run -it --rm --entrypoint /bin/bash --name $(IMAGE) $(REGISTRY)/$(IMAGE):latest
