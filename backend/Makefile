revision:
	@echo "[INFO] < Makimg migration revision with message '$(msg)' >"
	alembic revision --autogenerate -m "$(msg)"
	@echo "[INFO] < Migration revision created >"

upgrade:
	@echo "[INFO] < Upgrading database to the latest revision >"
	alembic upgrade head
	@echo "[INFO] < Database upgraded to the latest revision >"
