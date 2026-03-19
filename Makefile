release:
	cargo build --release && \
	cp target/release/blockcell ~/.local/bin/ && \
	blockcell --version


reload:
	cp -r skills/* ~/.blockcell/workspace/skills/ || true
	cargo run -p blockcell -- skills reload && \
	blockcell --versionREGISTRY ?= docker.io/blockcell-labs


# docker
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
